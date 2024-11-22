#!/bin/bash

curl --location 'localhost:8080/internal/calls/extensionAddedToContext' \
--header 'Content-Type: application/json' \
--data '{
    "context": "project",
    "extensionId": "5f5b7a5e-b46b-4efc-8747-9f08e933cc8b"
}'

curl --location 'localhost:8080/internal/calls/instanceUpdated' \
--header 'Content-Type: application/json' \
--data '{
    "context": "project",
    "extensionId": "5f5b7a5e-b46b-4efc-8747-9f08e933cc8b"
}'

curl --location 'localhost:8080/internal/calls/secretRotated' \
--header 'Content-Type: application/json' \
--data '{
    "context": "project",
    "extensionId": "5f5b7a5e-b46b-4efc-8747-9f08e933cc8b"
}'

curl --location 'localhost:8080/internal/calls/instanceRemovedFromContext' \
--header 'Content-Type: application/json' \
--data '{
    "context": "project",
    "extensionId": "5f5b7a5e-b46b-4efc-8747-9f08e933cc8b"
}'