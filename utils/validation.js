const Joi = require("@hapi/joi");
const email = Joi.string().min(6).required().email();
const password = Joi.string().min(6).required();
const mobile_no = Joi.number().required();
const address = Joi.string().required();
const role = Joi.string().required();

const commonFields = {
  email,
  password,
};

const driverFields = {
  ...commonFields,
  username: Joi.string().min(6).required(),
  role: role.valid("driver"),
  share_contacts: Joi.number().required(),
  radius: Joi.number().required(),
  contacts: Joi.array().required(),
  hardware_status: Joi.string().required(),
  auto_app_update: Joi.number().required(),
  id_no: Joi.number().required(),
  social_app: Joi.number().required(),
  emergency_help: Joi.number().required(),
};

const companyFields = {
  ...commonFields,
  company_name: Joi.string().required(),
  mobile_no,
  company_bio: Joi.string().required(),
  address,
  id_no: Joi.number().required(),
  role: role.valid("company"),
};

const superAdminFields = {
  ...commonFields,
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  mobile_no,
  address,
  role: role.valid("super_admin"),
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
  return schema.validate(data);
};

const loginValidation = (data) => {
  const schema = Joi.object({
    email,
    password,
  });
  return schema.validate(data);
};

module.exports = { registerValidation, loginValidation };
