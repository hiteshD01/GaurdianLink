const Joi = require("@hapi/joi");

const registerValidation = (data) => {
  const schema = Joi.object({
    username: Joi.string().min(6).required(),
    email: Joi.string().min(6).required().email(),
    password: Joi.string().min(6).required(),
    first_name: Joi.string(),
    last_name: Joi.string(),
    role: Joi.string(),
    company_name: Joi.string(),
    mobile_no: Joi.number(),
    address: Joi.string(),
    // hardware: Joi.string(),
    // vehicle: Joi.string(),
    share_contacts: Joi.number(),
    radius: Joi.number(),
    contacts: Joi.array(),
    hardware_status: Joi.string(),
    trips: Joi.array(),
    auto_app_update: Joi.number(),
    id_no: Joi.number(),
    social_app: Joi.number(),
    company_bio: Joi.string(),
    emergency_help: Joi.number(),
    disable: Joi.boolean(),
  });
  return schema.validate(data);
};

const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().min(6).required().email(),
    password: Joi.string().min(6).required(),
  });
  return schema.validate(data);
};

module.exports = { registerValidation, loginValidation };
