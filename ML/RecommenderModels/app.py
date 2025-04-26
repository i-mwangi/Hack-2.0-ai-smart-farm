from flask import Flask, request, jsonify
import joblib
import pandas as pd
import random
from flask_cors import CORS
import yaml

# Load configuration
with open('config.yaml', 'r') as config_file:
    config = yaml.safe_load(config_file)

app = Flask(__name__)
CORS(app)
application = app

# Load models from config paths
model = joblib.load(config['models']['paths']['rf_model'])
rf_model = joblib.load(config['models']['paths']['random_forest_regressor'])
model_crop = joblib.load(config['models']['paths']['crop_model'])
scaler = joblib.load(config['models']['paths']['scaler'])

# Get mappings from config
soil_type_mapping = config['mappings']['soil_type']
crop_type_mapping = config['mappings']['crop_type']
fertilizer_name_mapping = config['mappings']['fertilizer_name']
fertilizer_descriptions = config['fertilizer_descriptions']

# Create reverse mappings
soil_type_inverse_mapping = {v: k for k, v in soil_type_mapping.items()}
crop_type_inverse_mapping = {v: k for k, v in crop_type_mapping.items()}

# Get feature ranges
feature_ranges = config['feature_ranges']['fertilizer']
feature_ranges2 = config['feature_ranges']['crop']

# Get RF columns
rf_cols = config['rf_columns']

# Route for home page
@app.route('/', methods=['GET'])
def home():
    return jsonify({
        "status": "success",
        "message": "Welcome to the Agricultural Recommendation API",
        "endpoints": [
            "/predict - General prediction endpoint",
            "/fertilizer-recommend - Fertilizer recommendation endpoint",
            "/crop-recommend - Crop recommendation endpoint"
        ]
    })

# Route for general prediction
@app.route('/predict', methods=['POST'])
def predict():
    try:
        data = request.get_json()
        
        # Extract features from the request
        features = [data.get(col, 0) for col in rf_cols]
        features_df = pd.DataFrame([features], columns=rf_cols)
        
        # Make prediction
        prediction = rf_model.predict(features_df)
        
        return jsonify({
            "status": "success",
            "prediction": prediction[0],
            "message": "Prediction made successfully"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400

# Route for fertilizer recommendation
@app.route('/fertilizer-recommend', methods=['POST'])
def fertilizer_recommend():
    try:
        data = request.get_json()
        
        # Extract features for fertilizer recommendation
        N = float(data.get('nitrogen', 0))
        P = float(data.get('phosphorous', 0))
        K = float(data.get('potassium', 0))
        soil_type = data.get('soil_type', '')
        crop_type = data.get('crop_type', '')
        
        # Convert text inputs to numeric using mapping
        soil_type_num = soil_type_mapping.get(soil_type.lower(), 0)
        crop_type_num = crop_type_mapping.get(crop_type.lower(), 0)
        
        # Create feature array
        input_features = [[N, P, K, soil_type_num, crop_type_num]]
        
        # Scale features if needed
        if scaler:
            input_features = scaler.transform(input_features)
        
        # Make prediction
        fertilizer_prediction = model.predict(input_features)[0]
        fertilizer_name = fertilizer_name_mapping.get(fertilizer_prediction, "Unknown Fertilizer")
        fertilizer_info = fertilizer_descriptions.get(str(fertilizer_prediction), 
                                                    "No description available")
        
        return jsonify({
            "status": "success",
            "fertilizer_id": int(fertilizer_prediction),
            "fertilizer_name": fertilizer_name,
            "description": fertilizer_info,
            "message": "Fertilizer recommendation successful"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400

# Route for crop recommendation
@app.route('/crop-recommend', methods=['POST'])
def crop_recommend():
    try:
        data = request.get_json()
        
        # Extract features for crop recommendation
        N = float(data.get('nitrogen', 0))
        P = float(data.get('phosphorous', 0))
        K = float(data.get('potassium', 0))
        temperature = float(data.get('temperature', 0))
        humidity = float(data.get('humidity', 0))
        ph = float(data.get('ph', 0))
        rainfall = float(data.get('rainfall', 0))
        
        # Create feature array
        input_features = [[N, P, K, temperature, humidity, ph, rainfall]]
        
        # Make prediction
        crop_prediction = model_crop.predict(input_features)[0]
        crop_name = crop_type_inverse_mapping.get(crop_prediction, "Unknown Crop")
        
        return jsonify({
            "status": "success",
            "crop_id": int(crop_prediction),
            "crop_name": crop_name,
            "message": "Crop recommendation successful"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 400

if __name__ == '__main__':
    app.run(debug=True)