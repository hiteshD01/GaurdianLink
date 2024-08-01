const Joi = require("@hapi/joi");

const email = Joi.string().min(6).required().email();
const password = Joi.string().min(6).required();
const mobile_no = Joi.number().required();
const address = Joi.string().required();
const role = Joi.string().required();
const type = Joi.string().valid("email_pass", "google", "facebook").required();
const uid = Joi.when("type", {
  is: Joi.string().valid("google", "facebook"),
  then: Joi.string().required(),
  otherwise: Joi.string().allow(""),
});
const profileImage = Joi.string();

const commonFields = {
  email,
  password,
  type,
  uid,
  // profileImage
};

const driverFields = {
  ...commonFields,
  username: Joi.string().min(6).required(),
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
};

const superAdminFields = {
  ...commonFields,
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  mobile_no,
  address,
  role: role.valid("super_admin"),
  profileImage,
};

const schemas = {
  driver: Joi.object(driverFields),
  company: Joi.object(companyFields),
  super_admin: Joi.object(superAdminFields),
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
    fcm_token: Joi.string().required(),
  });
  return schema.validate(data);
};

module.exports = { registerValidation, loginValidation };
