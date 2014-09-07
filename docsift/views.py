from flask import render_template, request
from flask import send_file
from flask_pager import Pager

from docsift.app import stash
from docsift.filters import app
from docsift.search import make_query, es, es_index


@app.route("/collections/<collection>/document/<hash>/<path:file>")
def download(collection, hash, file):
    document = stash.get(collection).get(hash)
    return send_file(document.file)


@app.route("/collections/<collection>/document/<hash>")
def details(collection, hash):
    document = stash.get(collection).get(hash)

    meta = {}
    for key, value in document.items():
        if key in app.config.get('HIDE_FIELDS', []):
            continue
        if isinstance(value, (dict, list, tuple)) and not len(value):
            continue
        elif not len(unicode(value).strip()):
            continue
        meta[key] = value
    meta = sorted(meta.items())

    if 'snippet' in request.args:
        return render_template('_details.html', document=document, meta=meta)
    return render_template('document.html', document=document, meta=meta)


@app.route("/")
def index():
    s = make_query()
    if 'collection' in request.args:
        s = s.doctypes(*request.args.getlist('collection'))
    if 'query' in request.args and len(request.args.get('query')):
        s = s.query(_all__query_string=request.args.get('query'))
        s = s.highlight('title', 'text', 'file')
    #print s, list(s) #, s.build_search()
    return render_template('index.html',
                           pager=Pager(s, limit=15),
                           query=request.args.get('query', ''))
