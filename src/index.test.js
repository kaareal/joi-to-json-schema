const Joi = require('joi');
const convert = require('./index');
const jsonSchema = require('json-schema');

describe('convert', () => {
  test('should handle object defaults', () => {
    const joi = Joi.object();
    expect(convert(joi)).toEqual({
      type: 'object',
      properties: {},
      patterns: [],
      additionalProperties: false
    });
  });

  test('object options language label', () => {
    const joi = Joi.object().options({ language: { label: 'Title' } });
    expect(convert(joi)).toEqual({
      type: 'object',
      title: 'Title',
      properties: {},
      patterns: [],
      additionalProperties: false
    });
  });

  test('object description', () => {
    const joi = Joi.object().description('woot');
    expect(convert(joi)).toEqual({
      type: 'object',
      properties: {},
      patterns: [],
      additionalProperties: false,
      description: 'woot'
    });
  });

  test('object example', () => {
    const joi = Joi.object().example({ key: 'value' });
    expect(convert(joi)).toEqual({
      type: 'object',
      properties: {},
      patterns: [],
      additionalProperties: false,
      example: { key: 'value' },
      examples: [{ key: 'value' }]
    });
  });

  test('object without unknown keys', () => {
    const joi = Joi.object().unknown(false);
    expect(convert(joi)).toEqual({
      type: 'object',
      properties: {},
      patterns: [],
      additionalProperties: false
    });
  });

  test('object allow unknown', () => {
    const joi = Joi.object().unknown(true);
    expect(convert(joi)).toEqual({
      type: 'object',
      properties: {},
      patterns: [],
      additionalProperties: true
    });
  });

  test('object', () => {
    let joi = Joi.object().keys({
      string: Joi.string(),
      'string default': Joi.string()
        .default('bar')
        .description('bar desc'),
      number: Joi.number(),
      boolean: Joi.boolean()
    });
    expect(convert(joi)).toEqual({
      type: 'object',
      properties: {
        string: {
          type: 'string'
        },
        'string default': {
          type: 'string',
          default: 'bar',
          description: 'bar desc'
        },
        number: {
          type: 'number'
        },
        boolean: {
          type: 'boolean'
        }
      },
      patterns: [],
      additionalProperties: false
    });
  });

  test('object property required', () => {
    const joi = Joi.object().keys({
      string: Joi.string(),
      'string default': Joi.string()
        .default('bar')
        .description('bar desc'),
      number: Joi.number(),
      'boolean required': Joi.boolean().required()
    });
    expect(convert(joi)).toEqual({
      type: 'object',
      required: ['boolean required'],
      properties: {
        string: {
          type: 'string'
        },
        'string default': {
          type: 'string',
          default: 'bar',
          description: 'bar desc'
        },
        number: {
          type: 'number'
        },
        'boolean required': {
          type: 'boolean'
        }
      },
      patterns: [],
      additionalProperties: false
    });
  });

  test('object property forbidden', () => {
    const joi = Joi.object().keys({
      string: Joi.string(),
      'string default': Joi.string()
        .default('bar')
        .description('bar desc'),
      'number forbidden': Joi.number().forbidden(),
      'boolean required': Joi.boolean().required()
    });
    expect(convert(joi)).toEqual({
      type: 'object',
      required: ['boolean required'],
      properties: {
        string: {
          type: 'string'
        },
        'string default': {
          type: 'string',
          default: 'bar',
          description: 'bar desc'
        },
        'boolean required': {
          type: 'boolean'
        }
      },
      patterns: [],
      additionalProperties: false
    });
  });

  test('type: array', () => {
    const joi = Joi.array();
    expect(convert(joi)).toEqual({
      type: 'array'
    });
  });

  test('enum', () => {
    const joi = Joi.string().valid(['a', 'b']);
    expect(convert(joi)).toEqual({
      type: 'string',
      enum: ['a', 'b']
    });
  });

  test('alternatives -> oneOf', () => {
    const joi = Joi.object().keys({
      value: Joi.alternatives().try(Joi.string().valid('a'), Joi.number().valid(100))
    });
    expect(convert(joi)).toEqual({
      type: 'object',
      patterns: [],
      additionalProperties: false,
      properties: {
        value: {
          oneOf: [
            {
              type: 'string',
              enum: ['a']
            },
            {
              type: 'number',
              enum: [100]
            }
          ]
        }
      }
    });
  });

  test('string min/max', () => {
    const joi = Joi.string()
      .min(5)
      .max(100);
    expect(convert(joi)).toEqual({
      type: 'string',
      minLength: 5,
      maxLength: 100
    });
  });

  test('string -> maxLength', () => {
    const joi = Joi.string().length(5);
    expect(convert(joi)).toEqual({
      type: 'string',
      maxLength: 5,
      minLength: 5
    });
  });

  test('string email', () => {
    const joi = Joi.string().email();
    expect(convert(joi)).toEqual({
      type: 'string',
      format: 'email'
    });
  });

  test('string uri', () => {
    const joi = Joi.string().uri();
    expect(convert(joi)).toEqual({
      type: 'string',
      format: 'uri'
    });
  });

  test('date', () => {
    const joi = Joi.date();
    expect(convert(joi)).toEqual({
      type: 'string',
      format: 'date-time'
    });
  });

  test('date (javascript timestamp)', () => {
    const joi = Joi.date().timestamp();
    expect(convert(joi)).toEqual({
      type: 'integer'
    });
  });

  test('date (unix timestamp)', () => {
    const joi = Joi.date().timestamp('unix');
    expect(convert(joi)).toEqual({
      type: 'integer'
    });
  });

  test('string regex -> pattern', () => {
    const joi = Joi.string().regex(/^[a-z]$/);
    expect(convert(joi)).toEqual({
      type: 'string',
      pattern: '^[a-z]$'
    });
  });

  test('string allow', () => {
    const joi = Joi.string().allow(['a', 'b', '', null]);
    expect(convert(joi)).toEqual({
      type: 'string',
      enum: ['a', 'b', '', null]
    });
  });

  test('number min/max', () => {
    const joi = Joi.number()
      .min(0)
      .max(100);
    expect(convert(joi)).toEqual({
      type: 'number',
      minimum: 0,
      maximum: 100
    });
  });

  test('number greater/less', () => {
    const joi = Joi.number()
      .greater(0)
      .less(100);
    expect(convert(joi)).toEqual({
      type: 'number',
      minimum: 0,
      exclusiveMinimum: true,
      maximum: 100,
      exclusiveMaximum: true
    });
  });

  test('integer', () => {
    const joi = Joi.number().integer();
    expect(convert(joi)).toEqual({
      type: 'integer'
    });
  });

  test('array min/max', () => {
    const joi = Joi.array()
      .min(5)
      .max(100);
    expect(convert(joi)).toEqual({
      type: 'array',
      minItems: 5,
      maxItems: 100
    });
  });

  test('array length', () => {
    const joi = Joi.array().length(100);
    expect(convert(joi)).toEqual({
      type: 'array',
      minItems: 100,
      maxItems: 100
    });
  });

  test('array unique', () => {
    const joi = Joi.array().unique();
    expect(convert(joi)).toEqual({
      type: 'array',
      uniqueItems: true
    });
  });

  test('array inclusions', () => {
    let joi = Joi.array().items(Joi.string());
    expect(convert(joi)).toEqual({
      type: 'array',
      items: { type: 'string' }
    });
  });

  test('array ordered (tuple-like)', () => {
    let joi = Joi.array().ordered(Joi.string().required(), Joi.number().optional());
    expect(convert(joi)).toEqual({
      type: 'array',
      ordered: [{ type: 'string' }, { type: 'number' }]
    });
  });

  test('joi any', () => {
    let joi = Joi.any();
    expect(convert(joi)).toEqual({
      type: ['array', 'boolean', 'number', 'object', 'string', 'null']
    });
  });

  test('big and complicated', () => {
    const joi = Joi.object({
      aFormattedString: Joi.string().regex(/^[ABC]_\w+$/),
      aFloat: Joi.number()
        .default(0.8)
        .min(0.0)
        .max(1.0),
      anInt: Joi.number()
        .required()
        .precision(0)
        .greater(0),
      aForbiddenString: Joi.string().forbidden(),
      anArrayOfFloats: Joi.array().items(
        Joi.number()
          .default(0.8)
          .min(0.0)
          .max(1.0)
      ),
      anArrayOfNumbersOrStrings: Joi.array().items(Joi.alternatives(Joi.number(), Joi.string()))
    });
    expect(convert(joi)).toEqual({
      type: 'object',
      properties: {
        aFormattedString: {
          type: 'string',
          pattern: '^[ABC]_\\w+$'
        },
        aFloat: {
          default: 0.8,
          type: 'number',
          minimum: 0,
          maximum: 1
        },
        anInt: {
          type: 'number',
          exclusiveMinimum: true,
          minimum: 0
        },
        anArrayOfFloats: {
          type: 'array',
          items: {
            default: 0.8,
            type: 'number',
            minimum: 0,
            maximum: 1
          }
        },
        anArrayOfNumbersOrStrings: {
          type: 'array',
          items: {
            oneOf: [
              {
                type: 'number'
              },
              {
                type: 'string'
              }
            ]
          }
        }
      },
      additionalProperties: false,
      patterns: [],
      required: ['anInt']
    });
  });

  test.skip('joi.lazy warn against recursion', () => {
    const Person = Joi.object({
      name: Joi.string(),
      children: Joi.array().items(Joi.lazy(() => Person))
    });
    expect(convert(Person)).toThrowError();
  });

  test('joi.lazy', () => {
    const Child = Joi.object({
      name: Joi.string()
    });

    const Parent = Joi.object({
      name: Joi.string(),
      children: Joi.array().items(Joi.lazy(() => Child))
    });

    expect(convert(Parent)).toEqual({
      additionalProperties: false,
      patterns: [],
      properties: {
        children: {
          items: {
            additionalProperties: false,
            patterns: [],
            properties: { name: { type: 'string' } },
            type: 'object'
          },
          type: 'array'
        },
        name: { type: 'string' }
      },
      type: 'object'
    });
  });

  test('joi.when', () => {
    const joi = Joi.object({
      a: Joi.boolean()
        .required()
        .default(false),
      b: Joi.alternatives().when('a', {
        is: true,
        then: Joi.string().default('a is true'),
        otherwise: Joi.number().default(0)
      })
    });
    expect(convert(joi)).toEqual({
      type: 'object',
      properties: {
        a: {
          type: 'boolean',
          default: false
        },
        b: {
          oneOf: [
            {
              default: 'a is true',
              type: 'string'
            },
            {
              type: 'number',
              default: 0
            }
          ]
        }
      },
      patterns: [],
      additionalProperties: false,
      required: ['a']
    });
  });

  test('joi.when without is', () => {
    let joi = Joi.object({
      a: Joi.boolean()
        .required()
        .default(false),
      b: Joi.alternatives().when(Joi.object({ type: Joi.string() }), {
        then: Joi.object({
          type: Joi.string(),
          number: Joi.number()
        }),
        otherwise: Joi.object({
          type: Joi.string(),
          number: Joi.number()
        })
      })
    });
    expect(convert(joi)).toEqual({
      type: 'object',
      properties: {
        a: {
          default: false,
          type: 'boolean'
        },
        b: {
          oneOf: [
            {
              type: 'object',
              properties: {
                type: {
                  type: 'string'
                },
                number: {
                  type: 'number'
                }
              },
              additionalProperties: false,
              patterns: []
            },
            {
              type: 'object',
              properties: {
                type: {
                  type: 'string'
                },
                number: {
                  type: 'number'
                }
              },
              additionalProperties: false,
              patterns: []
            }
          ]
        }
      },
      additionalProperties: false,
      patterns: [],
      required: ['a']
    });
  });
});
