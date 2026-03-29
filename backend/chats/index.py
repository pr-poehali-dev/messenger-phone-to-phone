"""
Чаты и сообщения. action: list, create, messages, send, upload.
"""
import json
import os
import base64
import uuid
import psycopg2
import boto3

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p60083583_messenger_phone_to_p")

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_s3():
    return boto3.client(
        "s3",
        endpoint_url="https://bucket.poehali.dev",
        aws_access_key_id=os.environ["AWS_ACCESS_KEY_ID"],
        aws_secret_access_key=os.environ["AWS_SECRET_ACCESS_KEY"],
    )

def auth(conn, token: str):
    cur = conn.cursor()
    cur.execute(
        f"SELECT u.id, u.name FROM {SCHEMA}.sessions s "
        f"JOIN {SCHEMA}.users u ON u.id = s.user_id WHERE s.token = %s",
        (token,)
    )
    row = cur.fetchone()
    return {"id": row[0], "name": row[1]} if row else None

def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    headers = event.get("headers", {}) or {}
    token = headers.get("X-Auth-Token") or headers.get("x-auth-token", "")
    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "")

    conn = get_conn()
    user = auth(conn, token)
    if not user:
        conn.close()
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

    uid = user["id"]

    # list — список чатов
    if action == "list":
        cur = conn.cursor()
        cur.execute(f"""
            SELECT c.id, c.is_group, c.name,
                   (SELECT u2.id FROM {SCHEMA}.chat_members cm2
                    JOIN {SCHEMA}.users u2 ON u2.id = cm2.user_id
                    WHERE cm2.chat_id = c.id AND cm2.user_id != {uid} LIMIT 1),
                   (SELECT u2.name FROM {SCHEMA}.chat_members cm2
                    JOIN {SCHEMA}.users u2 ON u2.id = cm2.user_id
                    WHERE cm2.chat_id = c.id AND cm2.user_id != {uid} LIMIT 1),
                   (SELECT u2.online FROM {SCHEMA}.chat_members cm2
                    JOIN {SCHEMA}.users u2 ON u2.id = cm2.user_id
                    WHERE cm2.chat_id = c.id AND cm2.user_id != {uid} LIMIT 1),
                   (SELECT m.text FROM {SCHEMA}.messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1),
                   (SELECT m.created_at FROM {SCHEMA}.messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1),
                   (SELECT COUNT(*) FROM {SCHEMA}.messages m WHERE m.chat_id = c.id AND m.is_read = FALSE AND m.sender_id != {uid}),
                   (SELECT m.media_type FROM {SCHEMA}.messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1)
            FROM {SCHEMA}.chats c
            JOIN {SCHEMA}.chat_members cm ON cm.chat_id = c.id AND cm.user_id = {uid}
            ORDER BY (SELECT m.created_at FROM {SCHEMA}.messages m WHERE m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 1) DESC NULLS LAST
        """)
        rows = cur.fetchall()
        chats = []
        for row in rows:
            last_msg = row[6]
            if not last_msg and row[9]:
                last_msg = "📷 Фото" if row[9] == "image" else "🎥 Видео"
            chats.append({
                "id": row[0],
                "is_group": row[1],
                "name": row[2] if row[1] else row[4],
                "partner_id": row[3],
                "partner_online": row[5],
                "last_msg": last_msg,
                "last_time": row[7].isoformat() if row[7] else None,
                "unread": int(row[8])
            })
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"chats": chats})}

    # create — создать личный чат
    if action == "create":
        partner_id = body.get("partner_id")
        if not partner_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "partner_id required"})}

        cur = conn.cursor()
        cur.execute(f"""
            SELECT c.id FROM {SCHEMA}.chats c
            JOIN {SCHEMA}.chat_members cm1 ON cm1.chat_id = c.id AND cm1.user_id = {uid}
            JOIN {SCHEMA}.chat_members cm2 ON cm2.chat_id = c.id AND cm2.user_id = {int(partner_id)}
            WHERE c.is_group = FALSE LIMIT 1
        """)
        existing = cur.fetchone()
        if existing:
            conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"chat_id": existing[0]})}

        cur.execute(f"INSERT INTO {SCHEMA}.chats (is_group) VALUES (FALSE) RETURNING id")
        chat_id = cur.fetchone()[0]
        cur.execute(f"INSERT INTO {SCHEMA}.chat_members (chat_id, user_id) VALUES ({chat_id}, {uid})")
        cur.execute(f"INSERT INTO {SCHEMA}.chat_members (chat_id, user_id) VALUES ({chat_id}, {int(partner_id)})")
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"chat_id": chat_id})}

    # messages — сообщения чата
    if action == "messages":
        chat_id = body.get("chat_id")
        if not chat_id:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "chat_id required"})}

        cur = conn.cursor()
        cur.execute(f"""
            SELECT m.id, m.sender_id, u.name, m.text, m.created_at, m.is_read, m.media_url, m.media_type
            FROM {SCHEMA}.messages m
            JOIN {SCHEMA}.users u ON u.id = m.sender_id
            WHERE m.chat_id = {int(chat_id)}
            ORDER BY m.created_at ASC
            LIMIT 100
        """)
        rows = cur.fetchall()
        cur.execute(
            f"UPDATE {SCHEMA}.messages SET is_read = TRUE WHERE chat_id = {int(chat_id)} AND sender_id != {uid} AND is_read = FALSE"
        )
        conn.commit()
        messages = [{"id": r[0], "sender_id": r[1], "sender_name": r[2], "text": r[3],
                     "created_at": r[4].isoformat(), "is_read": r[5], "mine": r[1] == uid,
                     "media_url": r[6], "media_type": r[7]} for r in rows]
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"messages": messages})}

    # send — отправить сообщение
    if action == "send":
        chat_id = body.get("chat_id")
        text = (body.get("text") or "").strip()
        media_url = body.get("media_url")
        media_type = body.get("media_type")

        if not chat_id or (not text and not media_url):
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "chat_id и text или media обязательны"})}

        cur = conn.cursor()
        cur.execute(f"SELECT id FROM {SCHEMA}.chat_members WHERE chat_id = {int(chat_id)} AND user_id = {uid}")
        if not cur.fetchone():
            conn.close()
            return {"statusCode": 403, "headers": CORS, "body": json.dumps({"error": "Нет доступа к чату"})}

        cur.execute(
            f"INSERT INTO {SCHEMA}.messages (chat_id, sender_id, text, media_url, media_type) VALUES (%s, %s, %s, %s, %s) RETURNING id, created_at",
            (int(chat_id), uid, text or None, media_url, media_type)
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({
            "message": {"id": row[0], "sender_id": uid, "sender_name": user["name"],
                        "text": text, "created_at": row[1].isoformat(), "mine": True,
                        "media_url": media_url, "media_type": media_type}
        })}

    # upload — загрузить файл в S3
    if action == "upload":
        file_data = body.get("file_data")
        file_name = body.get("file_name", "file")
        file_type = body.get("file_type", "image/jpeg")

        if not file_data:
            conn.close()
            return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "file_data обязателен"})}

        ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else "jpg"
        key = f"chat_media/{uid}/{uuid.uuid4()}.{ext}"
        raw = base64.b64decode(file_data)

        s3 = get_s3()
        s3.put_object(Bucket="files", Key=key, Body=raw, ContentType=file_type)

        access_key = os.environ["AWS_ACCESS_KEY_ID"]
        cdn_url = f"https://cdn.poehali.dev/projects/{access_key}/bucket/{key}"
        media_type = "video" if file_type.startswith("video") else "image"

        conn.close()
        return {"statusCode": 200, "headers": CORS, "body": json.dumps({"url": cdn_url, "media_type": media_type})}

    conn.close()
    return {"statusCode": 400, "headers": CORS, "body": json.dumps({"error": "Укажите action"})}
