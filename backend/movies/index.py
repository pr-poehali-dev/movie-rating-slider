import json
import os
import psycopg2  # noqa

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def row_to_movie(row):
    has_ratings = row[6] is not None
    return {
        'id': row[0],
        'title': row[1],
        'genre': row[2],
        'year': row[3],
        'poster': row[4],
        'rating': float(row[5]),
        'myRatings': {
            'quality': row[6],
            'plot': row[7],
            'characters': row[8],
            'atmosphere': row[9],
        } if has_ratings else None,
        'review': row[10],
    }

def handler(event: dict, context) -> dict:
    """CRUD для фильмов: GET список, POST создать, PUT обновить, DELETE удалить."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    # id из query (?id=123) или из пути /movies/123
    params = event.get('queryStringParameters') or {}
    movie_id = None
    if params.get('id') and str(params['id']).isdigit():
        movie_id = int(params['id'])
    else:
        path = event.get('path', '/')
        parts = [p for p in path.split('/') if p]
        if parts and parts[-1].isdigit():
            movie_id = int(parts[-1])

    conn = get_conn()
    cur = conn.cursor()

    try:
        # GET /movies — список всех фильмов
        if method == 'GET':
            cur.execute(
                'SELECT id, title, genre, year, poster, rating, '
                'rating_quality, rating_plot, rating_characters, rating_atmosphere, review '
                'FROM movies ORDER BY created_at DESC'
            )
            movies = [row_to_movie(r) for r in cur.fetchall()]
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(movies, ensure_ascii=False)}

        body = json.loads(event.get('body') or '{}')
        if movie_id is None and body.get('id'):
            movie_id = int(body['id'])

        # POST /movies — создать фильм
        if method == 'POST':
            cur.execute(
                'INSERT INTO movies (title, genre, year, poster, rating, review) '
                'VALUES (%s, %s, %s, %s, %s, %s) RETURNING id',
                (
                    body['title'],
                    body.get('genre', ''),
                    body.get('year', 0),
                    body.get('poster', ''),
                    body.get('rating', 0),
                    body.get('review', ''),
                )
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            return {'statusCode': 201, 'headers': CORS, 'body': json.dumps({'id': new_id})}

        # PUT /movies/123 — обновить фильм (данные или оценки)
        if method == 'PUT' and movie_id:
            ratings = body.get('myRatings')
            cur.execute(
                'UPDATE movies SET title=%s, genre=%s, year=%s, poster=%s, rating=%s, '
                'rating_quality=%s, rating_plot=%s, rating_characters=%s, rating_atmosphere=%s, review=%s '
                'WHERE id=%s',
                (
                    body['title'],
                    body.get('genre', ''),
                    body.get('year', 0),
                    body.get('poster', ''),
                    body.get('rating', 0),
                    ratings['quality'] if ratings else None,
                    ratings['plot'] if ratings else None,
                    ratings['characters'] if ratings else None,
                    ratings['atmosphere'] if ratings else None,
                    body.get('review', ''),
                    movie_id,
                )
            )
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        # DELETE /movies/123 — удалить фильм
        if method == 'DELETE' and movie_id:
            cur.execute('DELETE FROM movies WHERE id=%s', (movie_id,))
            conn.commit()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'ok': True})}

        return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'Bad request'})}

    finally:
        cur.close()
        conn.close()