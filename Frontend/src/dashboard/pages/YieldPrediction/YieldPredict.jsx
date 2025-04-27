import React, { useState } from "react";
import { Sprout, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { soilType, cropType, district, season } from "../../../../data";
import axios from "axios";

function YieldPredict() {
  const [formData, setFormData] = useState({
    area: 100,
    district: "",
    crop: "",
    season: "",
    nitrogen: 50,
    phosphorous: 50,
    potassium: 50,
    temperature: 25,
    humidity: 60,
    ph: 6.5,
    rainfall: 100,
    soilType: "",
    soilMoisture: 40
  });
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const isNumericField = ['area', 'nitrogen', 'phosphorous', 'potassium', 'temperature', 'humidity', 'ph', 'rainfall', 'soilMoisture'].includes(name);
    setFormData((prev) => ({
      ...prev,
      [name]: isNumericField ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPrediction(null);
    setErrorMessage(null);

    const payload = {
        area: formData.area,
        district: formData.district,
        season: formData.season,
        crop: formData.crop,
        crop_type: formData.crop,
        soilType: formData.soilType,
        soil_type: formData.soilType,
        nitrogen: formData.nitrogen,
        phosphorous: formData.phosphorous,
        potassium: formData.potassium,
        soilMoisture: formData.soilMoisture,
        soil_moisture: formData.soilMoisture,
        temperature: formData.temperature,
        humidity: formData.humidity,
        ph: formData.ph,
        rainfall: formData.rainfall
    };

    Object.keys(payload).forEach(key => {
      if (payload[key] === "") {
        delete payload[key];
      }
    });

    console.log("Reverted - Sending payload:", payload);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5002/predict", 
        payload 
      );
      console.log("Prediction response:", response.data);
      if (response.data.status === 'success' && response.data.prediction !== undefined) {
           setPrediction(response.data.prediction); 
      } else {
          setErrorMessage(response.data.message || "Prediction received, but format unexpected.");
      }

    } catch (error) {
      console.error("Error:", error);
      let msg = "Failed to get yield prediction. Please try again.";
      if (error.response && error.response.data && error.response.data.message) {
         msg = `Error: ${error.response.data.message}`; 
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-green-800 flex items-center justify-center gap-2">
            <Sprout className="h-6 w-6 text-green-600" />
            Crop Yield Prediction
          </CardTitle>
          <CardDescription className="text-center">
            Enter details to predict crop yield
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="area">Area (hectares)</Label>
                <Input id="area" name="area" type="number" required onChange={handleInputChange} value={formData.area || ""} placeholder="e.g., 100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District</Label>
                <Select name="district" onValueChange={(value) => handleSelectChange("district", value)} value={formData.district}>
                  <SelectTrigger><SelectValue placeholder="Select district" /></SelectTrigger>
                  <SelectContent>{district.map((item, index) => (<SelectItem value={item} key={index}>{item}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="season">Season</Label>
                <Select name="season" onValueChange={(value) => handleSelectChange("season", value)} value={formData.season}>
                  <SelectTrigger><SelectValue placeholder="Select season" /></SelectTrigger>
                  <SelectContent>{season.map((item, index) => (<SelectItem value={item} key={index}>{item}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nitrogen">Nitrogen (N)</Label>
                <Input id="nitrogen" name="nitrogen" type="number" required step="any" onChange={handleInputChange} value={formData.nitrogen || ""} placeholder="e.g., 50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phosphorous">Phosphorous (P)</Label>
                <Input id="phosphorous" name="phosphorous" type="number" required step="any" onChange={handleInputChange} value={formData.phosphorous || ""} placeholder="e.g., 50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="potassium">Potassium (K)</Label>
                <Input id="potassium" name="potassium" type="number" required step="any" onChange={handleInputChange} value={formData.potassium || ""} placeholder="e.g., 50" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input id="temperature" name="temperature" type="number" required step="any" onChange={handleInputChange} value={formData.temperature || ""} placeholder="e.g., 25" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="humidity">Humidity (%)</Label>
                <Input id="humidity" name="humidity" type="number" required step="any" onChange={handleInputChange} value={formData.humidity || ""} placeholder="e.g., 60" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ph">pH Level</Label>
                <Input id="ph" name="ph" type="number" required step="0.1" onChange={handleInputChange} value={formData.ph || ""} placeholder="e.g., 6.5" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rainfall">Rainfall (mm)</Label>
                <Input id="rainfall" name="rainfall" type="number" required step="any" onChange={handleInputChange} value={formData.rainfall || ""} placeholder="e.g., 100" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="soilMoisture">Soil Moisture</Label>
                <Input id="soilMoisture" name="soilMoisture" type="number" required step="any" onChange={handleInputChange} value={formData.soilMoisture || ""} placeholder="e.g., 40" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="soilType">Soil Type</Label>
                <Select name="soilType" onValueChange={(value) => handleSelectChange("soilType", value)} value={formData.soilType}>
                  <SelectTrigger><SelectValue placeholder="Select soil type" /></SelectTrigger>
                  <SelectContent>{soilType.map((item, index) => (<SelectItem value={item} key={index}>{item}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="crop">Crop</Label>
                <Select name="crop" onValueChange={(value) => handleSelectChange("crop", value)} value={formData.crop}>
                  <SelectTrigger><SelectValue placeholder="Select crop" /></SelectTrigger>
                  <SelectContent>{(crop || cropType).map((item, index) => (<SelectItem value={item} key={index}>{item}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                "Predict Yield"
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center pt-4">
          {errorMessage && (
             <p className="text-red-600 text-center mb-2">{errorMessage}</p>
          )}
          {prediction !== null && (
            <div className="text-center border-t pt-4 mt-2 w-full">
              <h3 className="font-semibold text-lg text-green-700 mb-1">
                Predicted Yield:
              </h3>
              <p className="text-xl font-bold text-green-900">
                {typeof prediction === 'number' ? `${prediction.toFixed(2)} units/hectare` : prediction} 
              </p>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default YieldPredict; 