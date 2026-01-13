from rest_framework import pagination
from rest_framework.response import Response


class CustomPagination(pagination.PageNumberPagination):
    """
    Custom pagination with friendly fields (no next/previous links).
    """

    page_size_query_param = "page_size"
    max_page_size = 100
    page_size = 20

    def get_paginated_response(self, data):
        return Response(
            {
                "count": self.page.paginator.count,
                "total_pages": self.page.paginator.num_pages,
                "current": self.page.number,
                "has_next": self.page.has_next(),
                "has_previous": self.page.has_previous(),
                "results": data,
            }
        )

    def get_paginated_response_schema(self, schema):
        return {
            "type": "object",
            "required": [
                "count",
                "current",
                "total_pages",
                "has_next",
                "has_previous",
                "results",
            ],
            "properties": {
                "count": {"type": "integer", "example": 123},
                "total_pages": {"type": "integer", "example": 7},
                "results": schema,
                "current": {"type": "integer", "example": 2},
                "has_next": {"type": "boolean", "example": True},
                "has_previous": {"type": "boolean", "example": True},
            },
        }
