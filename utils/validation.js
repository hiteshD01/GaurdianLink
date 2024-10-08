const Joi = require("@hapi/joi");

const email = Joi.string().min(6).required().email();
const password = Joi.string().min(6).required();
const mobile_no = Joi.number();
const address = Joi.string();
const role = Joi.string().required();
const type = Joi.string().valid("email_pass", "google", "facebook").required();
const uid = Joi.when("type", {
  is: Joi.string().valid("google", "facebook"),
  then: Joi.string().required(),
  otherwise: Joi.string().allow("")
});
const profileImage = Joi.string();

const commonFields = {
  email,
  password,
  type,
  uid
  // profileImage
};

const driverFields = {
  ...commonFields,

  // username: Joi.string().min(6).required(),
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  role: role.valid("driver"),
  share_contacts: Joi.number(),
  radius: Joi.number(),
  hardware_status: Joi.string(),
  auto_app_update: Joi.number(),
  id_no: Joi.number(),
  social_app: Joi.number(),
  emergency_help: Joi.number(),
  emergency_contact_1_email: Joi.string(),
  emergency_contact_1_contact: Joi.number(),
  emergency_contact_2_email: Joi.string(),
  emergency_contact_2_contact: Joi.number(),
  fcm_token: Joi.string(),
  profileImage,
  mobile_no,
  address,
  company_name: Joi.string(),
  company_id: Joi.string()
};

const companyFields = {
  ...commonFields,
  company_name: Joi.string().required(),
  mobile_no,
  company_bio: Joi.string().required(),
  address,
  id_no: Joi.number().required(),
  role: role.valid("company"),
  profileImage,
  contact_name: Joi.string(),
  share_contacts: Joi.number(),
  radius: Joi.number(),
  hardware_status: Joi.string(),
  auto_app_update: Joi.number(),
  id_no: Joi.number(),
  social_app: Joi.number(),
  emergency_help: Joi.number(),
  emergency_contact_1_email: Joi.string(),
  emergency_contact_1_contact: Joi.number(),
  emergency_contact_2_email: Joi.string(),
  emergency_contact_2_contact: Joi.number(),
  fcm_token: Joi.string(),
  profileImage,
  mobile_no,
  address,
  company_name: Joi.string(),
  company_id: Joi.string()
};

const superAdminFields = {
  ...commonFields,
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  mobile_no,
  address,
  role: role.valid("super_admin"),
  profileImage,
  share_contacts: Joi.number(),
  radius: Joi.number(),
  hardware_status: Joi.string(),
  auto_app_update: Joi.number(),
  id_no: Joi.number(),
  social_app: Joi.number(),
  emergency_help: Joi.number(),
  emergency_contact_1_email: Joi.string(),
  emergency_contact_1_contact: Joi.number(),
  emergency_contact_2_email: Joi.string(),
  emergency_contact_2_contact: Joi.number(),
  fcm_token: Joi.string(),
  profileImage,
  mobile_no,
  address,
  company_name: Joi.string(),
  company_id: Joi.string()
};

const locationFields = {
  lat: Joi.string().optional(),
  long: Joi.string().optional(),
  address: Joi.string().optional(),
  type: Joi.string().valid("sos", "start_trip", "end_trip").optional(),
  help_received: Joi.string().valid("help_received", "cancel", "").optional(),
  req_reach: Joi.number().optional(),
  req_accept: Joi.number().optional()
};

const schemas = {
  driver: Joi.object(driverFields),
  company: Joi.object(companyFields),
  super_admin: Joi.object(superAdminFields),
  location: Joi.object(locationFields)
};

const registerValidation = (data) => {
  const schema = schemas[data.role];
  if (!schema) {
    return { error: { details: [{ message: "Invalid role" }] } };
  }

  // Conditionally add fcm_token for driver role
  if (data.role === "driver") {
    schema.fcm_token = Joi.string().required();
  }

  return schema.validate(data);
};

const loginValidation = (data) => {
  const schema = Joi.object({
    email,
    password,
    fcm_token: Joi.string().required()
  });
  return schema.validate(data);
};

const locationUpdateValidation = (data) => {
  return schemas.location.validate(data);
};

module.exports = {
  registerValidation,
  loginValidation,
  locationUpdateValidation
};
