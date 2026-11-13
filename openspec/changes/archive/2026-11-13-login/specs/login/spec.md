# Spec Delta

## Purpose

Вход по ссылке из письма, чтобы каждый человек видел и менял только свои контакты, заметки и группы.

## ADDED Requirements

### Requirement: Signed-out visitor sees the login page

The system SHALL показывать страницу входа, если человек не вошёл. На странице MUST быть поле почты и кнопка «Получить ссылку».

#### Scenario: Open the app without a session

- **WHEN** человек открывает приложение и не вошёл
- **THEN** видна страница входа с полем почты и кнопкой «Получить ссылку»

### Requirement: A valid email sends one sign-in letter

The system SHALL после верной почты показать «Ссылка для входа отправлена на <почта>» и отправить одно письмо со ссылкой. В тексте MUST быть почта, на которую ушло письмо.

#### Scenario: Request a link

- **WHEN** человек вводит верную почту и нажимает «Получить ссылку»
- **THEN** виден текст «Ссылка для входа отправлена на <почта>»
- **AND** письмо со ссылкой приходит на эту почту

### Requirement: Email is trimmed and case-insensitive

The system SHALL убирать пробелы по краям почты и не различать большие и маленькие буквы. Показанная почта и адрес письма MUST быть уже в таком виде.

#### Scenario: Trim and lowercase

- **WHEN** человек вводит « A@Example.COM »
- **THEN** текст говорит, что ссылка отправлена на a@example.com
- **AND** письмо уходит на a@example.com

### Requirement: An invalid email sends nothing

The system SHALL при неверном адресе показать под полем «Проверь адрес почты» и MUST не отправлять письмо. Та же проверка MUST сработать, если запрос пришёл не из формы.

#### Scenario: Bad address on the form

- **WHEN** человек отправляет адрес без почты
- **THEN** под полем видно «Проверь адрес почты»
- **AND** письмо не уходит

#### Scenario: Bad address from a direct request

- **WHEN** на сервер приходит запрос не из формы с тем же неверным адресом
- **THEN** письмо не уходит
- **AND** ответ сообщает «Проверь адрес почты»

### Requirement: The sent message hides whether the account exists

The system SHALL показывать один и тот же текст «Ссылка для входа отправлена на <почта>» и для новой почты, и для уже известной. По этому тексту MUST быть нельзя понять, есть ли уже такой пользователь.

#### Scenario: New email

- **WHEN** человек запрашивает ссылку на почту, которой ещё нет
- **THEN** виден текст «Ссылка для входа отправлена на <почта>»

#### Scenario: Existing email

- **WHEN** человек запрашивает ссылку на почту, которая уже есть
- **THEN** виден тот же текст «Ссылка для входа отправлена на <почта>»

### Requirement: The link signs the person in

The system SHALL по первой рабочей ссылке пускать внутрь, к своим контактам. Отдельной формы регистрации MUST не быть, имя MUST не спрашиваться. Первый вход MUST создавать пользователя.

#### Scenario: Open a fresh link

- **WHEN** человек открывает рабочую ссылку из письма
- **THEN** он внутри и видит свои контакты

#### Scenario: First visit creates the account

- **WHEN** человек впервые открывает рабочую ссылку
- **THEN** пользователь создан
- **AND** отдельной формы и вопроса об имени не было

### Requirement: A link works once and for 15 minutes

The system SHALL принимать a sign-in link once and only within 15 minutes. После этого система MUST показать «Ссылка устарела, запроси новую» и кнопку на страницу входа.

#### Scenario: Open the link a second time

- **WHEN** человек открывает уже использованную ссылку
- **THEN** видно «Ссылка устарела, запроси новую»
- **AND** есть кнопка на страницу входа

#### Scenario: Open the link after 15 minutes

- **WHEN** человек открывает ссылку через 15 минут после запроса
- **THEN** видно «Ссылка устарела, запроси новую»
- **AND** есть кнопка на страницу входа

### Requirement: A new link invalidates older links

The system SHALL делать недействительными прежние ссылки этой почты, когда запрошена новая.

#### Scenario: Request a second link

- **WHEN** человек запросил вторую ссылку, не использовав первую
- **THEN** первая ссылка открывает «Ссылка устарела, запроси новую»
- **AND** вторая ссылка пускает внутрь

### Requirement: Three letters per email in ten minutes

The system SHALL отправлять не больше 3 писем на одну почту за 10 минут. На четвёртую попытку система MUST показать «Слишком часто, попробуй через несколько минут» и MUST не отправлять письмо.

#### Scenario: Fourth letter is refused

- **WHEN** на одну почту за 10 минут уже ушло 3 письма и запрошено четвёртое
- **THEN** видно «Слишком часто, попробуй через несколько минут»
- **AND** четвёртое письмо не уходит

### Requirement: A session lasts 30 days from the last visit

The system SHALL держать вход 30 дней с последнего захода на этом устройстве. Заход MUST продлевать срок. На другом устройстве SHALL быть свой вход одновременно. Выход MUST заканчивать вход только на том устройстве, где нажали «Выйти».

#### Scenario: Return within 30 days

- **WHEN** человек заходил на этом устройстве меньше 30 дней назад
- **THEN** он внутри без новой ссылки

#### Scenario: Return after 30 days

- **WHEN** с последнего захода на этом устройстве прошло больше 30 дней
- **THEN** видна страница входа

#### Scenario: Sign out on one device

- **WHEN** человек вошёл с двух устройств и нажимает «Выйти» на одном
- **THEN** на этом устройстве видна страница входа
- **AND** на другом устройстве он остаётся внутри

### Requirement: Header shows the email and sign-out

The system SHALL показывать в шапке почту вошедшего пользователя и кнопку «Выйти».

#### Scenario: Signed-in header

- **WHEN** человек вошёл
- **THEN** в шапке видны его почта и кнопка «Выйти»

#### Scenario: Sign out

- **WHEN** человек нажимает «Выйти»
- **THEN** видна страница входа

### Requirement: A person sees only their own records

The system SHALL показывать и менять только записи вошедшего пользователя: список, поиск, карточку, заметки, группы, фильтр по группе и блок «Пора связаться».

#### Scenario: List and search hide the other person's contact

- **WHEN** A вошёл, добавил контакт и B вошёл под своей почтой
- **THEN** контакта A нет в списке B
- **AND** поиска B по имени этого контакта тоже нет

#### Scenario: Notes, groups, and the due block stay separate

- **WHEN** у A есть заметка, группа и просроченный контакт, а B вошёл под своей почтой
- **THEN** B не видит заметку, группу и этот контакт в блоке «Пора связаться»

### Requirement: A foreign record cannot be opened or changed

The system SHALL на прямую ссылку к чужому контакту отвечать «Контакт не найден», как будто записи нет. Прямой запрос к серверу с номером чужой записи MUST ничего не отдавать и MUST ничего не менять.

#### Scenario: Direct link to someone else's contact

- **WHEN** B открывает прямую ссылку на контакт A
- **THEN** видно «Контакт не найден»

#### Scenario: Direct server request for someone else's record

- **WHEN** B отправляет серверу номер контакта, заметки или группы A
- **THEN** данные A не приходят
- **AND** записи A не меняются

### Requirement: A new user starts with an empty list

The system SHALL показывать новому пользователю пустой список и подсказку «Добавь первый контакт».

#### Scenario: First list

- **WHEN** человек впервые оказывается внутри и контактов у него нет
- **THEN** список пуст
- **AND** видна подсказка «Добавь первый контакт»

### Requirement: Existing rows stay and gain one owner

The system SHALL оставить все уже лежащие контакты, заметки и группы и назначить им одного владельца. Число контактов, заметок и групп после этого MUST совпасть с числом до изменения.

#### Scenario: Nothing is dropped

- **WHEN** у уже лежащих записей появляется владелец
- **THEN** контактов, заметок и групп столько же, сколько было
- **AND** все эти записи принадлежат одному пользователю

### Requirement: Demo data belongs to the owner

The system SHALL создавать демо-данные у того же владельца, которому достались уже лежащие записи. Другой вошедший пользователь MUST их не видеть.

#### Scenario: A second person does not see the demo contacts

- **WHEN** демо-данные созданы у владельца и другой человек входит под своей почтой
- **THEN** демо-контактов в его списке нет

### Requirement: The sign-in letter has fixed wording

The system SHALL отправлять письмо от имени «Личная CRM» с адреса `noreply@mail.crm.<домен>`. Тема MUST быть «Вход в Личную CRM». В письме MUST быть кнопка «Войти», фраза, что ссылка работает 15 минут, и фраза «Если вы не запрашивали вход - просто проигнорируйте письмо».

#### Scenario: Letter contents

- **WHEN** письмо входа отправлено
- **THEN** отправитель «Личная CRM», адрес начинается с `noreply@mail.crm.`
- **AND** тема «Вход в Личную CRM»
- **AND** в письме есть кнопка «Войти», срок 15 минут и просьба проигнорировать письмо, если вход не запрашивали

### Requirement: The same build sends letters locally, in tests, and on the server

The system SHALL на компьютере разработчика и в автотестах, в том числе на GitHub, класть письмо в почтовый ящик-заглушку и MUST не отправлять настоящее письмо. Автотест MUST брать ссылку из этой заглушки. На сервере система SHALL отправлять настоящее письмо. Одна и та же сборка MUST работать везде: куда слать письмо, решают настройки.

#### Scenario: Local mailbox stub

- **WHEN** ссылку запрашивают на компьютере разработчика
- **THEN** письмо видно в заглушке в браузере
- **AND** настоящее письмо не уходит

#### Scenario: Browser test reads the link from the stub

- **WHEN** автотест запрашивает вход
- **THEN** он берёт ссылку из той же заглушки
- **AND** настоящее письмо не уходит

#### Scenario: Server sends a real letter

- **WHEN** ссылку запрашивают на сервере
- **THEN** уходит настоящее письмо
