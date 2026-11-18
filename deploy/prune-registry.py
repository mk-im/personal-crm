#!/usr/bin/env python3
"""Keep the newest tagged GHCR images, including manifests they reference.

GitHub stores each build as several package versions: the tagged image index
and untagged children (the platform image and the attestation). A cleanup that
counts every version therefore deletes children the remaining tags still need,
and those tags can no longer be pulled.
"""

import base64
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

KEEP_TAGGED_IMAGES = 10
ACCEPT = ", ".join(
    [
        "application/vnd.oci.image.index.v1+json",
        "application/vnd.oci.image.manifest.v1+json",
        "application/vnd.docker.distribution.manifest.list.v2+json",
        "application/vnd.docker.distribution.manifest.v2+json",
    ]
)


class CleanupError(Exception):
    pass


def normalize_digest(value):
    if not isinstance(value, str):
        return None
    digest = value.strip().lower()
    prefix = "sha256:"
    if not digest.startswith(prefix) or len(digest) != len(prefix) + 64:
        return None
    if any(char not in "0123456789abcdef" for char in digest[len(prefix) :]):
        return None
    return digest


def tags_of(version):
    metadata = version.get("metadata") or {}
    container = metadata.get("container") or {}
    tags = container.get("tags") or []
    return [tag for tag in tags if isinstance(tag, str) and tag]


def sort_key(version):
    return (version.get("created_at") or "", version.get("id") or 0)


def is_index(media_type):
    if not isinstance(media_type, str):
        return False
    return "image.index" in media_type or "manifest.list" in media_type


def referenced_manifests(body):
    found = []
    for manifest in body.get("manifests") or []:
        digest = normalize_digest(manifest.get("digest"))
        if digest:
            found.append((digest, manifest.get("mediaType") or ""))
    return found


def versions_to_delete(versions, keep_ids, keep_digests):
    deleting = []
    for version in versions:
        if version.get("id") in keep_ids:
            continue
        digest = normalize_digest(version.get("name"))
        if digest and digest in keep_digests:
            continue
        if digest is None:
            label = version.get("name")
            raise CleanupError(
                f"Version {version.get('id')} has no sha256 name ({label!r}). "
                "Refusing to delete anything."
            )
        deleting.append(version)
    return deleting


def choose_kept(versions, keep_count):
    tagged = [version for version in versions if tags_of(version)]
    tagged.sort(key=sort_key, reverse=True)
    if keep_count < 1:
        raise CleanupError("KEEP_TAGGED_IMAGES must be at least 1.")
    return tagged[:keep_count]


def _request(url, headers, method="GET"):
    request = urllib.request.Request(url, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request) as response:
            return response.status, response.read(), response.headers
    except urllib.error.HTTPError as error:
        return error.code, error.read(), error.headers


def github_json(token, method, path):
    api = os.environ.get("GITHUB_API_URL", "https://api.github.com").rstrip("/")
    status, body, _headers = _request(
        api + path,
        {
            "Authorization": f"Bearer {token}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
            "User-Agent": "personal-crm-prune-registry",
        },
        method,
    )
    if status not in (200, 204):
        detail = body.decode("utf-8", "replace")[:500]
        raise CleanupError(f"GitHub API {method} {path} failed: HTTP {status} {detail}")
    if not body:
        return None
    return json.loads(body.decode("utf-8"))


def package_prefix(token, owner, package):
    quoted_owner = urllib.parse.quote(owner)
    quoted_package = urllib.parse.quote(package)
    for kind in ("users", "orgs"):
        prefix = f"/{kind}/{quoted_owner}/packages/container/{quoted_package}"
        api = os.environ.get("GITHUB_API_URL", "https://api.github.com").rstrip("/")
        status, _body, _headers = _request(
            api + prefix + "/versions?per_page=1",
            {
                "Authorization": f"Bearer {token}",
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "User-Agent": "personal-crm-prune-registry",
            },
        )
        if status == 200:
            return prefix
        if status != 404:
            detail = _body.decode("utf-8", "replace")[:300]
            raise CleanupError(
                f"Could not list package versions via {prefix}: HTTP {status} {detail}"
            )
    raise CleanupError(f"Package {owner}/{package} was not found.")


def list_versions(token, prefix):
    versions = []
    page = 1
    while True:
        batch = github_json(
            token, "GET", f"{prefix}/versions?per_page=100&page={page}"
        )
        if not isinstance(batch, list):
            raise CleanupError("Unexpected package version list.")
        versions.extend(batch)
        if len(batch) < 100:
            return versions
        page += 1


def registry_token(owner, package, github_token):
    basic = base64.b64encode(f"{owner}:{github_token}".encode()).decode()
    scope = urllib.parse.quote(f"repository:{owner}/{package}:pull", safe="")
    status, body, _headers = _request(
        f"https://ghcr.io/token?service=ghcr.io&scope={scope}",
        {"Authorization": f"Basic {basic}"},
    )
    if status != 200:
        raise CleanupError(f"Could not sign in to GHCR: HTTP {status}")
    return json.loads(body.decode("utf-8"))["token"]


def fetch_manifest(reg_token, owner, package, reference):
    status, body, headers = _request(
        f"https://ghcr.io/v2/{owner}/{package}/manifests/{reference}",
        {"Authorization": f"Bearer {reg_token}", "Accept": ACCEPT},
    )
    if status != 200:
        raise CleanupError(
            f"Cannot read manifest {reference}: HTTP {status}. "
            "Refusing to delete anything."
        )
    digest = normalize_digest(headers.get("Docker-Content-Digest"))
    if digest is None:
        raise CleanupError(
            f"Manifest {reference} has no digest. Refusing to delete anything."
        )
    return digest, json.loads(body.decode("utf-8"))


def collect_digests(reg_token, owner, package, reference, depth=0):
    digest, body = fetch_manifest(reg_token, owner, package, reference)
    found = {digest}
    for child, media_type in referenced_manifests(body):
        found.add(child)
        if depth < 2 and is_index(media_type):
            found |= collect_digests(reg_token, owner, package, child, depth + 1)
    if depth == 0:
        status, raw, _headers = _request(
            f"https://ghcr.io/v2/{owner}/{package}/referrers/{digest}",
            {
                "Authorization": f"Bearer {reg_token}",
                "Accept": "application/vnd.oci.image.index.v1+json",
            },
        )
        if status == 200:
            referrers = json.loads(raw.decode("utf-8"))
            for child, _media_type in referenced_manifests(referrers):
                found.add(child)
        elif status not in (400, 404):
            raise CleanupError(
                f"Cannot read referrers for {reference}: HTTP {status}. "
                "Refusing to delete anything."
            )
    return found


def prune(token, owner, package, keep_count):
    prefix = package_prefix(token, owner, package)
    versions = list_versions(token, prefix)
    kept = choose_kept(versions, keep_count)
    tagged_count = sum(1 for version in versions if tags_of(version))
    print(f"Tagged images: {tagged_count}. Keeping {len(kept)}.")
    if not versions:
        print("Registry cleanup complete.")
        return
    if tagged_count == 0:
        raise CleanupError("No tagged images found. Refusing to delete anything.")
    for version in kept:
        print(
            "  keep "
            + ", ".join(tags_of(version))
            + f" created {version.get('created_at')}"
        )

    keep_ids = {version["id"] for version in kept}
    keep_digests = set()
    if kept:
        reg_token = registry_token(owner, package, token)
        for version in kept:
            own = normalize_digest(version.get("name"))
            if own:
                keep_digests.add(own)
            digests = collect_digests(reg_token, owner, package, tags_of(version)[0])
            if not digests:
                raise CleanupError(
                    f"No digests for {tags_of(version)[0]}. Refusing to delete anything."
                )
            keep_digests |= digests

    deleting = versions_to_delete(versions, keep_ids, keep_digests)
    print(f"Manifests kept with those images: {len(keep_digests)}.")
    print(f"Deleting {len(deleting)} package versions.")
    for version in deleting:
        if version.get("id") in keep_ids:
            raise CleanupError("Refusing to delete a kept image.")
        label = ", ".join(tags_of(version)) or version.get("name")
        print(f"  delete {version['id']} {label}")
        github_json(token, "DELETE", f"{prefix}/versions/{version['id']}")
    print("Registry cleanup complete.")


def run_self_test():
    def digest(number):
        return "sha256:" + f"{number:064x}"

    def version(vid, name, tags, created):
        return {
            "id": vid,
            "name": name,
            "created_at": created,
            "metadata": {"container": {"tags": tags}},
        }

    versions = []
    vid = 1
    for image in range(12):
        day = f"2026-01-{image + 1:02d}"
        versions.append(version(vid, digest(image * 3 + 1), [], f"{day}T02:59:50Z"))
        vid += 1
        versions.append(version(vid, digest(image * 3 + 2), [], f"{day}T02:59:55Z"))
        vid += 1
        versions.append(
            version(vid, digest(image * 3), [f"{image:040x}"], f"{day}T03:00:00Z")
        )
        vid += 1
    versions.append(version(vid, digest(1000), [], "2026-02-01T00:00:00Z"))

    kept = choose_kept(versions, 10)
    assert [int(tags_of(item)[0], 16) for item in kept] == list(range(11, 1, -1))
    keep_ids = {item["id"] for item in kept}
    keep_digests = set()
    for item in kept:
        image = int(tags_of(item)[0], 16)
        keep_digests.add(digest(image * 3))
        keep_digests.add(digest(image * 3 + 1))
        keep_digests.add(digest(image * 3 + 2))

    deleting = versions_to_delete(versions, keep_ids, keep_digests)
    deleted_tags = sorted(tags_of(item)[0] for item in deleting if tags_of(item))
    assert deleted_tags == [f"{image:040x}" for image in range(2)]
    assert len(deleting) == 7
    deleted_names = {item["name"] for item in deleting}
    assert digest(2 * 3 + 1) not in deleted_names
    assert digest(11 * 3 + 1) not in deleted_names
    assert digest(1000) in deleted_names

    index = {
        "manifests": [
            {
                "digest": digest(1),
                "mediaType": "application/vnd.oci.image.manifest.v1+json",
            },
            {
                "digest": digest(2),
                "mediaType": "application/vnd.oci.image.manifest.v1+json",
                "annotations": {"vnd.docker.reference.type": "attestation-manifest"},
            },
        ]
    }
    assert [item[0] for item in referenced_manifests(index)] == [digest(1), digest(2)]
    assert is_index("application/vnd.oci.image.index.v1+json")
    assert is_index("application/vnd.docker.distribution.manifest.list.v2+json")
    assert not is_index("application/vnd.oci.image.manifest.v1+json")

    try:
        versions_to_delete([version(1, "not-a-digest", [], "2026-01-01T00:00:00Z")], set(), set())
    except CleanupError:
        pass
    else:
        raise AssertionError("an unnamed version must stop the cleanup")
    print("self-test ok")


def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--self-test":
        run_self_test()
        return
    token = os.environ.get("GH_TOKEN", "")
    repository = os.environ.get("GITHUB_REPOSITORY", "")
    if not token or "/" not in repository:
        raise CleanupError("GH_TOKEN and GITHUB_REPOSITORY are required.")
    owner, package = repository.split("/", 1)
    keep_count = int(os.environ.get("KEEP_TAGGED_IMAGES", str(KEEP_TAGGED_IMAGES)))
    prune(token, owner, package, keep_count)


if __name__ == "__main__":
    try:
        main()
    except CleanupError as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
    except urllib.error.URLError as error:
        print(f"Network error: {error.reason}", file=sys.stderr)
        sys.exit(1)
