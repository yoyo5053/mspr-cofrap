#!/usr/bin/env python
from flask import Flask, request, jsonify, make_response
from waitress import serve
import os
from function import handler

app = Flask(__name__)

class Event:
    def __init__(self):
        self.body = request.get_data()
        self.headers = request.headers
        self.method = request.method
        self.query = request.args
        self.path = request.path

class Context:
    def __init__(self):
        self.hostname = os.getenv('HOSTNAME', 'localhost')

def format_status_code(resp):
    if 'statusCode' in resp:
        return resp['statusCode']
    return 200

def format_body(resp):
    if 'body' not in resp:
        return ""
    elif type(resp['body']) == dict:
        return jsonify(resp['body'])
    else:
        return str(resp['body'])

def format_headers(resp):
    if 'headers' not in resp:
        return []
    elif type(resp['headers']) == dict:
        headers = []
        for key in resp['headers'].keys():
            header_tuple = (key, resp['headers'][key])
            headers.append(header_tuple)
        return headers
    return resp['headers']

def format_response(resp):
    if resp == None:
        return ('', 200)
    if type(resp) is dict:
        statusCode = format_status_code(resp)
        body = format_body(resp)
        headers = format_headers(resp)
        return (body, statusCode, headers)
    return resp

# Ajout OPTIONS dans les méthodes + after_request pour les headers CORS
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, PATCH, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

@app.route('/', defaults={'path': ''}, methods=['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'])
@app.route('/<path:path>', methods=['GET', 'PUT', 'POST', 'PATCH', 'DELETE', 'OPTIONS'])
def call_handler(path):
    # Répondre directement au preflight OPTIONS
    if request.method == 'OPTIONS':
        return ('', 200)

    event = Event()
    context = Context()
    response_data = handler.handle(event, context)
    resp = format_response(response_data)
    return resp

if __name__ == '__main__':
    serve(app, host='0.0.0.0', port=5000)
