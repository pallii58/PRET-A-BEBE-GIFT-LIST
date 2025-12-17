import Joi from "joi";

export const giftListSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  customer_email: Joi.string().email().required(),
  first_name: Joi.string().allow("", null),
  last_name: Joi.string().allow("", null),
  phone: Joi.string().allow("", null),
});

export const giftListItemSchema = Joi.object({
  product_id: Joi.string().required(),
  variant_id: Joi.string().required(),
  quantity: Joi.number().integer().min(1).default(1),
  product_title: Joi.string().allow("", null),
  product_image: Joi.string().allow("", null),
  product_price: Joi.string().allow("", null),
  product_handle: Joi.string().allow("", null),
});

