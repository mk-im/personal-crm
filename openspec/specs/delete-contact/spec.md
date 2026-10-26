# Delete contact

Убрать человека из CRM, чтобы он больше не появлялся в списке.

## Requirements

### Requirement: Delete from the contact card

The system SHALL позволять удалить контакт с карточки этого контакта.

#### Scenario: Delete a contact

- **WHEN** пользователь открыл карточку контакта и подтвердил удаление
- **THEN** контакта нет в списке
- **AND** карточка этого контакта больше не открывается

#### Scenario: Notes are removed with the contact

- **WHEN** пользователь удаляет контакт, у которого были заметки
- **THEN** заметки этого контакта тоже удаляются

### Requirement: Confirm before delete

The system SHALL спрашивать подтверждение, прежде чем удалить контакт.

#### Scenario: Cancel keeps the contact

- **WHEN** пользователь начал удаление, но не подтвердил
- **THEN** контакт и заметки остаются как были
