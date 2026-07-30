## ADDED Requirements

### Requirement: Every search is logged to search_history with a generated public id

The system SHALL, for each `GET /search` request, generate a unique public id (ulid) and write a `search_history` row containing that id, the requesting user's id (or `null` for guests), and the raw searched text.

#### Scenario: Guest search is logged with a null userId

- **WHEN** an unauthenticated caller performs a search with text `"beach house"`
- **THEN** a `search_history` row is created with `userId` set to `null` and `query` set to `"beach house"`

#### Scenario: Authenticated search is logged with the caller's userId

- **WHEN** an authenticated caller performs a search with text `"beach house"`
- **THEN** a `search_history` row is created with `userId` set to the caller's id and `query` set to `"beach house"`

#### Scenario: Each search generates a distinct id

- **WHEN** the same caller performs two separate searches
- **THEN** each resulting `search_history` row has a distinct `searchId`

### Requirement: The generated search id is returned to the client

The system SHALL include the generated `search_history` id (`searchId`) in the `GET /search` response, regardless of whether the underlying `search_history` write succeeds.

#### Scenario: searchId is present in a successful search response

- **WHEN** a search request completes successfully
- **THEN** the response includes a `searchId` field matching the `searchId` of the corresponding `search_history` row

### Requirement: A search_history write failure does not fail the search request

The system SHALL isolate failures writing the `search_history` row from the search response — the caller still receives search results and a `searchId` even if the row could not be persisted.

#### Scenario: Database is unavailable for the history write

- **WHEN** the `search_history` insert fails (e.g. database connection error) but the Typesense query succeeds
- **THEN** `GET /search` still responds with the search results and a `searchId`, and the failure is logged

### Requirement: search_history does not store search results

The system SHALL persist only the search query metadata (id, user, query text, timestamp) in `search_history` — it SHALL NOT persist the set of matching properties or any result data at search time.

#### Scenario: No result data is written alongside the query

- **WHEN** a search completes and matches one or more properties
- **THEN** the corresponding `search_history` row contains no reference to which properties matched
