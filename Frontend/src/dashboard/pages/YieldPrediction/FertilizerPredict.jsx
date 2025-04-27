import React, { useState } from "react";
import { Sprout, Loader2, FlaskConical, Thermometer, Droplets, TestTubeDiagonal, CloudRain } from "lucide-react";
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
import { soilType, cropType } from "../../../../data";
import axios from "axios";

function FertilizerPredict() {
  const [formData, setFormData] = useState({
    Crop: "",
    Nitrogen: 50,
    Phosphorous: 50,
    Potassium: 50,
    SoilType: "",
    temperature: 25,
    humidity: 60,
    ph: 6.5,
    rainfall: 100,
  });
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const isNumericField = ['Nitrogen', 'Phosphorous', 'Potassium', 'temperature', 'humidity', 'ph', 'rainfall'].includes(name);
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
      nitrogen: formData.Nitrogen,
      phosphorous: formData.Phosphorous,
      potassium: formData.Potassium,
      soil_type: formData.SoilType,
      crop_type: formData.Crop,
      temperature: formData.temperature,
      humidity: formData.humidity,
      ph: formData.ph,
      rainfall: formData.rainfall
    };

    console.log("Sending payload:", payload);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5002/predict",
        payload
      );
      console.log("Prediction response:", response.data);
      if (response.data.status === 'success') {
        setPrediction({
          name: response.data.fertilizer_name,
          description: response.data.description
        });
      } else {
        setErrorMessage(response.data.message || "Prediction failed.");
      }
    } catch (error) {
      console.error("Error:", error);
      let msg = "Failed to get fertilizer prediction. Please try again.";
      if (error.response && error.response.data && error.response.data.message) {
        msg = `Error: ${error.response.data.message}`;
      }
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-8 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-blue-800 flex items-center justify-center gap-2">
            <FlaskConical className="h-6 w-6 text-blue-600" />
            Fertilizer Recommendation
          </CardTitle>
          <CardDescription className="text-center">
            Enter soil and crop details to get a fertilizer recommendation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="Nitrogen">Nitrogen (N)</Label>
                <Input
                  id="Nitrogen"
                  name="Nitrogen"
                  type="number"
                  required
                  step="any"
                  onChange={handleInputChange}
                  value={formData.Nitrogen || ""}
                  placeholder="e.g., 50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="Phosphorous">Phosphorous (P)</Label>
                <Input
                  id="Phosphorous"
                  name="Phosphorous"
                  type="number"
                  required
                  step="any"
                  onChange={handleInputChange}
                  value={formData.Phosphorous || ""}
                  placeholder="e.g., 50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="Potassium">Potassium (K)</Label>
                <Input
                  id="Potassium"
                  name="Potassium"
                  type="number"
                  required
                  step="any"
                  onChange={handleInputChange}
                  value={formData.Potassium || ""}
                  placeholder="e.g., 50"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°C)</Label>
                <Input
                  id="temperature"
                  name="temperature"
                  type="number"
                  required
                  step="any"
                  onChange={handleInputChange}
                  value={formData.temperature || ""}
                  placeholder="e.g., 25"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="humidity">Humidity (%)</Label>
                <Input
                  id="humidity"
                  name="humidity"
                  type="number"
                  required
                  step="any"
                  onChange={handleInputChange}
                  value={formData.humidity || ""}
                  placeholder="e.g., 60"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ph">pH Level</Label>
                <Input
                  id="ph"
                  name="ph"
                  type="number"
                  required
                  step="0.1"
                  onChange={handleInputChange}
                  value={formData.ph || ""}
                  placeholder="e.g., 6.5"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rainfall">Rainfall (mm)</Label>
                <Input
                  id="rainfall"
                  name="rainfall"
                  type="number"
                  required
                  step="any"
                  onChange={handleInputChange}
                  value={formData.rainfall || ""}
                  placeholder="e.g., 100"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="SoilType">Soil Type</Label>
                <Select
                  name="SoilType"
                  onValueChange={(value) => handleSelectChange("SoilType", value)}
                  value={formData.SoilType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select soil type" />
                  </SelectTrigger>
                  <SelectContent>
                    {soilType.map((item, index) => (
                      <SelectItem value={item} key={index}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="Crop">Crop Type</Label>
                <Select
                  name="Crop"
                  onValueChange={(value) => handleSelectChange("Crop", value)}
                  value={formData.Crop}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select crop type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(cropType || crop).map((item, index) => (
                      <SelectItem value={item} key={index}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : (
                "Get Recommendation"
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
              <h3 className="font-semibold text-lg text-blue-700 mb-1">
                Recommended Fertilizer:
              </h3>
              <p className="text-xl font-bold text-blue-900 mb-2">
                {prediction.name}
              </p>
              <h3 className="font-semibold text-md text-blue-700 mb-1">
                Description:
              </h3>
              <p className="text-sm text-gray-700 text-left whitespace-pre-wrap">
                {prediction.description}
              </p>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

export default FertilizerPredict;
