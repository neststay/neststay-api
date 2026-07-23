The Nest Stay API

# Database and Models
- Models should be singular for example User, Property, Location etc. and their database table name will be plural. So, users, properties, locations etc.
- Foreign keys should follow camel case naming convention. so, locationId instead of location_id
- queries should be inside repositories and service should call the repositories to fetch data


# Global rules
- only services should be injected into other modules and should be exported from the parent modules
- repositories should never be used outside module
- controllers should always call services and not repositories
- requests, responses should always have a DTO
- service, repository should always define the type of data that they are taking as arguments and the response type
