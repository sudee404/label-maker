from rest_framework import pagination
from rest_framework.response import Response


class CustomPagination(pagination.PageNumberPagination):
    """
    Custom pagination class that removes 'next' and 'previous' fields
    and adds 'current', 'has_next', and 'has_previous' fields.
    """

    def get_paginated_response(self, data):
        """
        Return a custom paginated response with the following structure:
        {
            'results': data,
            'count': total item count,
            'current': current page number,
            'has_next': boolean indicating if next page exists,
            'has_previous': boolean indicating if previous page exists
        }
        """
        return Response(
            {
                "count": self.page.paginator.count,
                "current": self.page.number,
                "has_next": self.page.has_next(),
                "has_previous": self.page.has_previous(),
                "results": data,
            }
        )

    def get_paginated_response_schema(self, schema):
        """
        Return the schema for the custom paginated response.
        This is used for OpenAPI documentation generation.
        """
        return {
            "type": "object",
            "required": ["count", "results", "current", "has_next", "has_previous"],
            "properties": {
                "count": {
                    "type": "integer",
                    "example": 123,
                },
                "results": schema,
                "current": {
                    "type": "integer",
                    "example": 2,
                },
                "has_next": {
                    "type": "boolean",
                    "example": True,
                },
                "has_previous": {
                    "type": "boolean",
                    "example": True,
                },
            },
        }
