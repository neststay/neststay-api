## ADDED Requirements

### Requirement: Inactive properties are excluded from search results
The system SHALL always exclude properties where `isActive` is `false` from `GET /search` results. This filter SHALL be applied server-side and SHALL NOT be derived from, or overridable by, any caller-supplied query parameter.

#### Scenario: Inactive properties never appear in results
- **WHEN** the indexed `properties` collection contains both active and inactive documents matching a caller's search text and filters
- **THEN** the response only includes results where `isActive` is `true`

#### Scenario: Caller cannot request inactive results
- **WHEN** a caller sends `GET /search` with any combination of supported query parameters
- **THEN** there is no parameter that causes inactive properties to be included in the response
