#!/usr/bin/env bash
set -e

cd backend

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Collect static files (very important on Render!)
python manage.py collectstatic --noinput

# You can run migrations here, but many people prefer to run them manually first time
# python manage.py migrate