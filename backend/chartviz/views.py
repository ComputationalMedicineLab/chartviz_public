"""
Core ChartViz views.
"""
from os import getenv

import requests
from django.conf import settings
from django.contrib.auth.decorators import login_required
from django.http import (HttpResponse,
                         HttpResponseRedirect,
                         StreamingHttpResponse)
from django.template import engines
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import TemplateView


catchall_prod = TemplateView.as_view(template_name='index.html')
upstream = getenv('REACT_UPSTREAM', 'http://localhost:3000')


@csrf_exempt
def catchall_dev(request):
    upstream_url = upstream + request.path
    method = request.META['REQUEST_METHOD'].lower()
    response = getattr(requests, method)(upstream_url, stream=True)
    content_type = response.headers.get('Content-Type')

    if request.META.get('HTTP_UPGRADE', '').lower() == 'websocket':
        return HttpResponseRedirect(upstream_url + request.path)

    if content_type == 'text/html; charset=UTF-8':
        return HttpResponse(
            content=engines['django'].from_string(response.text).render(),
            status=response.status_code,
            reason=response.reason
        )

    return StreamingHttpResponse(
        streaming_content=response.iter_content(2 ** 12),
        content_type=content_type,
        status=response.status_code,
        reason=response.reason
    )


catchall = catchall_dev if settings.DEBUG else catchall_prod
catchall = login_required(catchall)
catchall.__doc__ = 'Serves the react app as a django view'
