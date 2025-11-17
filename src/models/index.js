function loadModel(name, path) {
  try {
    return require(path);
  } catch (error) {
    throw new Error(`Model '${name}' not found at path '${path}'`);
  }
}

module.exports = {
  User: loadModel("User", "./User"),
  Patient: loadModel("Patient", "./Patient"),
  Appointment: loadModel("Appointment", "./Appointment"),
  Consultation: loadModel("Consultation", "./Consultation"),
  Prescription: loadModel("Prescription", "./Prescription"),
  Pharmacy: loadModel("Pharmacy", "./Pharmacy"),
  LabOrder: loadModel("LabOrder", "./LabOrder"),
  LabResult: loadModel("LabResult", "./LabResult"),
  MedicalDocument: loadModel("MedicalDocument", "./MedicalDocument"),
  RefreshToken: loadModel("RefreshToken", "./RefreshToken"),
};


