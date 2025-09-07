from flask import Blueprint, render_template, session, redirect, url_for, request, flash, jsonify

from functools import wraps
import requests
import base64

main = Blueprint('main', __name__)

TCSERVER1 = "http://10.108.0.2:5000"

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_email' not in session:
            flash('You must be logged in to access this page.', 'error')
            return redirect(url_for('main.login'))
        return f(*args, **kwargs)
    return decorated_function

#History

@main.route('/api/history', methods=['POST'])
def proxy_history():
    try:        
        data = request.form
        resp = requests.post(f"{TCSERVER1}/update_history", data=data)
        return (resp.content, resp.status_code, resp.headers.items())
    except Exception as e:
        return jsonify({"error": f"Failed to connect to update server: {str(e)}"}), 500

@main.route('/api/get_history', methods=['GET'])
def fetch_history():
    try:
        resp = requests.get(f"{TCSERVER1}/get_history")
        return jsonify(resp.json())
    except Exception as e:
        return jsonify({"error": str(e)}), 500



#Users

@main.route('/api/register', methods=['POST'])
def proxy_register():
    try:
        data = request.get_json()
        resp = requests.post(f"{TCSERVER1}/register", json=data)
        return (resp.text, resp.status_code, resp.headers.items())
    except Exception as e:
        return {"error": f"Failed to connect to registration server: {str(e)}"}, 500
    
@main.route('/api/login')
def proxy_login():
    resp = requests.get(f"{TCSERVER1}/login")
    return resp.json()

#Expert Advisor

@main.route('/authenticate', methods=['POST'])
def authenticate():
    try:
        headers = {
            'X-EMAIL-ADDRESS': request.headers.get('X-EMAIL-ADDRESS'),
            'X-PASSWORD': request.headers.get('X-PASSWORD')
        }
        resp = requests.post(f"{TCSERVER1}/authenticate", headers=headers, json={})
        return (resp.text, resp.status_code, resp.headers.items())
    except Exception as e:
        return jsonify({"error": f"Failed to connect to auth server: {str(e)}"}), 500

@main.route('/update', methods=['POST'])
def update_proxy():
    try:
        headers = {
            'X-EMAIL-ADDRESS': request.headers.get('X-EMAIL-ADDRESS'),
            'X-PASSWORD': request.headers.get('X-PASSWORD'),
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        # Forward form data as-is
        data = request.form.to_dict(flat=True)  # converts ImmutableMultiDict to regular dict

        # Forward to actual trade server
        resp = requests.post(f"{TCSERVER1}/update", headers=headers, data=data)

        return (resp.text, resp.status_code, resp.headers.items())

    except Exception as e:
        return jsonify({"error": f"Proxy failed to reach trade server: {str(e)}"}), 500

@main.route('/signal', methods=['GET', 'POST'])
def signal_direct():
    try:
        headers = {
            'X-EMAIL-ADDRESS': request.headers.get('X-EMAIL-ADDRESS'),
            'X-PASSWORD': request.headers.get('X-PASSWORD'),
            # Set content-type explicitly as form-urlencoded
            'Content-Type': 'application/x-www-form-urlencoded'
        }

        if request.method == 'POST':
            # Forward the form data as dictionary (empty dict if none)
            data = request.form.to_dict() or {}
            resp = requests.post(f"{TCSERVER1}/signal", headers=headers, data=data)
        else:
            # On GET, just do a POST without data? Or adapt as needed
            resp = requests.get(f"{TCSERVER1}/signal", headers=headers)

        return (resp.text, resp.status_code, resp.headers.items())
    except Exception as e:
        return jsonify({"error": f"Failed to connect to signal server: {str(e)}"}), 500

@main.route('/')
def index():
    return render_template('index.html')

@main.route('/services')
def services():
    return render_template('services.html')

@main.route('/contact')
def contact():
    return render_template('contact.html')

@main.route('/about')
def about():
    return render_template('about.html')

@main.route('/consultations')
def consultations():
    return render_template('services/consultations.html')

@main.route('/bot_dev')
def bot_dev():
    return render_template('services/bot_dev.html')

@main.route('/signals')
def signals():
    return render_template('services/signals.html')

@main.route('/faq')
def faq():
    return render_template('faq.html')

@main.route('/t_and_c')
def t_and_c():
    return render_template('t_and_c.html')

@main.route('/privacy')
def privacy():
    return render_template('privacy.html')

@main.route('/register')
def register():
    if 'user_email' in session:        
        return redirect(url_for('main.setup'))
    return render_template('register.html')


@main.route('/history')
def history():
    return render_template('history.html')

@main.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        if not email or not password:
            flash('Please enter email and password.', 'error')
            return render_template('login.html')

        # Base64 encode the password
        encoded_password = base64.b64encode(password.encode('utf-8')).decode('utf-8')

        headers = {
            'X-EMAIL-ADDRESS': email,
            'X-PASSWORD': encoded_password
        }

        try:
            auth_response = requests.post('http://10.108.0.2:5000/login', headers=headers)           

            if auth_response.status_code == 200:
                session['user_email'] = email
                print(f"Session set for user_email: {email}")
                return redirect(url_for('main.setup'))
            else:
                try:
                    error_msg = auth_response.json().get('error', 'Login failed')
                except Exception:
                    error_msg = 'Login failed'
                flash(f'Login failed: {error_msg}', 'error')
        except Exception as e:
            flash(f'Authentication server unreachable: {e}', 'error')

    return render_template('login.html')

@main.route('/setup')
@login_required
def setup():
    user_email = session['user_email']
    flash(f'Welcome, {user_email}!', 'success')
    return render_template('setup.html')