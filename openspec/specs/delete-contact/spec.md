# Delete contact

Remove a person from the CRM so they no longer appear in the list.

## Requirements

### Requirement: Delete from the contact card

The system SHALL let the user delete a contact from that contact's card.

#### Scenario: Delete a contact

- **WHEN** the user opens a contact card and confirms deletion
- **THEN** the contact is removed from the list
- **AND** the contact card is no longer available

#### Scenario: Notes are removed with the contact

- **WHEN** the user deletes a contact that has notes
- **THEN** those notes are also removed

### Requirement: Confirm before delete

The system SHALL ask the user to confirm before deleting a contact.

#### Scenario: Cancel keeps the contact

- **WHEN** the user starts deletion but does not confirm
- **THEN** the contact and notes stay as they were
