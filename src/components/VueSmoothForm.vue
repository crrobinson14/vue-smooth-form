<template>
<form class="vue-smooth-form">
    <slot :form="form"></slot>
</form>
</template>

<script>
import set from 'object-set';

const getPath = event => (event instanceof Event ? event.target.name : event);

const getValue = (event, value) => {
  if (event instanceof Event) {
    if (event.target.type === 'checkbox' && event.target.checked !== undefined) {
      return event.target.checked;
    }

    return event.target.value;
  }

  return value;
};

// @see https://stackoverflow.com/questions/19098797/fastest-way-to-flatten-un-flatten-nested-json-objects
const flatten = data => {
  const result = {};

  function recurse(cur, prop) {
    if (Object(cur) !== cur) {
      result[prop] = cur;
    } else if (Array.isArray(cur)) {
      let i;
      let l;

      for (i = 0, l = cur.length; i < l; i++) {
        recurse(cur[i], prop + "[" + i + "]");
      }

      if (l === 0) {
        result[prop] = [];
      }
    } else {
      let isEmpty = true;
      for (let p in cur) {
        isEmpty = false;
        recurse(cur[p], prop ? prop + "." + p : p);
      }

      if (isEmpty && prop) {
        result[prop] = {};
      }
    }
  }

  recurse(data, "");
  return result;
};

export default {
  props: ['initialValues', 'validateForm', 'yupSchema'],
  data() {
    const paths = flatten(this.initialValues);
    const errors = {};
    const valid = {};
    const invalid = {};
    const touched = {};
    const untouched = {};
    const dirty = {};
    const pristine = {};

    Object.keys(paths).forEach(path => {
      errors[path] = null;
      valid[path] = true;
      invalid[path] = false;
      touched[path] = false;
      untouched[path] = true;
      dirty[path] = false;
      pristine[path] = true;
    });

    return {
      form: {
        onBlur: this.handleBlur.bind(this),
        onChange: this.handleChange.bind(this),
        onInput: this.handleInput.bind(this),
        setSubmitting: this.setSubmitting.bind(this),
        resetForm: this.resetForm.bind(this),
        setFieldValue: this.setFieldValue.bind(this),
        setFieldError: this.setFieldError.bind(this),
        setFieldTouched: this.setFieldTouched.bind(this),
        setFieldDirty: this.setFieldDirty.bind(this),
        setFormErrors: this.setFormErrors.bind(this),
        values: Object.assign({}, this.initialValues || {}),
        isValid: false,
        isSubmitting: false,
        errors,
        valid,
        invalid,
        touched,
        untouched,
        dirty,
        pristine,
      }
    };
  },

  mounted() {
    this.validate();
  },

  methods: {
    handleBlur(e) {
      const path = getPath(e);
      this.setFieldTouched(path, true);
      this.setFieldDirty(path, true);
    },

    async handleChange(e, v) {
      const path = getPath(e);
      const value = getValue(e, v);

      this.setFieldValue(path, value);
      this.$emit('value', { path, value, form: this });

      await this.validate();
    },

    async handleInput(e, v) {
      const path = getPath(e);
      const value = getValue(e, v);

      this.setFieldValue(path, value);
      this.$emit('value', { path, value, form: this });

      await this.validate();
    },

    setSubmitting(submitting) {
      this.form.isSubmitting = submitting;
    },

    resetForm() {
      Object.assign(this.form.values, this.initialValues);

      const paths = flatten(this.initialValues);
      Object.keys(paths).forEach(path => {
        this.setFieldTouched(path, false);
        this.setFieldDirty(path, false);
      });
    },

    setFieldError(path, error) {
      this.form.errors[path] = error;
      this.form.valid[path] = error === null;
      this.form.invalid[path] = error !== null;
    },

    setFieldValue(path, value) {
      set(this.form.values, path, value);
      this.setFieldTouched(path, true);
      this.setFieldDirty(path, true);
    },

    setFieldTouched(path, touched) {
      this.form.touched[path] = touched;
      this.form.untouched[path] = !touched;
    },

    setFieldDirty(path, dirty) {
      this.form.dirty[path] = dirty;
      this.form.pristine[path] = !dirty;
    },

    setFormErrors(errors) {
      this.form.isValid = true;

      Object.keys(errors).forEach(path => {
        this.setFieldError(path, errors[path]);

        if (this.form.invalid[path]) {
          this.form.isValid = false;
        }
      });
    },

    // Internal
    async validate() {
      if (this.validateForm) {
        return this.validateForm(this.form);
      }

      if (this.yupSchema) {
        const errors = {};
        Object.keys(this.form.errors).forEach(key => {
          errors[key] = null;
        });

        try {
          await this.yupSchema.validate(this.form.values, { abortEarly: false });
        } catch (e) {
          e.inner.forEach(error => {
            errors[error.path] = error.message;
          });
        }

        this.setFormErrors(errors);
      }

      return true;
    }
  }
};
</script>
