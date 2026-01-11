import base64

def file_to_base64(file_field):
    if not file_field:
        return None
    file_field.open('rb')
    try:
        data = file_field.read()
        return base64.b64encode(data).decode('utf-8')
    finally:
        file_field.close()