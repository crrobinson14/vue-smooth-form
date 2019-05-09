<template>
<form>
    <slot :form="form"></slot>
</form>
</template>

<script>
const fieldName = event => (event instanceof Event ? event.target.name : event);
const fieldValue = (event, value) => (event instanceof Event ? event.target.value : value);

export default {
  props: ['initialValues', 'validateForm'],
  data() {
    const fields = Object.keys(this.initialValues);
    const errors = {};
    const valid = {};
    const invalid = {};
    const touched = {};
    const untouched = {};
    const dirty = {};
    const pristine = {};

    fields.forEach(field => {
      errors[field] = null;
      valid[field] = true;
      invalid[field] = false;
      touched[field] = false;
      untouched[field] = true;
      dirty[field] = false;
      pristine[field] = true;
    });

    return {
      form: {
        onBlur: this.onBlur.bind(this),
        onChange: this.onChange.bind(this),
        onInput: this.onInput.bind(this),
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
    onBlur(e) {
      const field = fieldName(e);
      this.setFieldTouched(field, true);
      this.setFieldDirty(field, true);
    },

    async onChange(e, v) {
      this.setFieldValue(fieldName(e), fieldValue(e, v));

      await this.validate();
    },

    async onInput(e, v) {
      this.setFieldValue(fieldName(e), fieldValue(e, v));

      await this.validate();
    },

    setSubmitting(submitting) {
      this.form.isSubmitting = submitting;
    },

    resetForm() {
      Object.keys(this.initialValues).forEach(field => {
        this.form.values[field] = this.initialValues[field];

        this.setFieldTouched(field, false);
        this.setFieldDirty(field, false);
      });
    },

    setFieldError(field, error) {
      this.form.errors[field] = error;
      this.form.valid[field] = error === null;
      this.form.invalid[field] = error !== null;
    },

    setFieldValue(field, value) {
      this.form.values[field] = value;

      this.setFieldTouched(field, true);
      this.setFieldDirty(field, true);
    },

    setFieldTouched(field, touched) {
      this.form.touched[field] = touched;
      this.form.untouched[field] = !touched;
    },

    setFieldDirty(field, dirty) {
      this.form.dirty[field] = dirty;
      this.form.pristine[field] = !dirty;
    },

    setFormErrors(errors) {
      this.form.isValid = true;

      Object.keys(errors).forEach(field => {
        this.setFieldError(field, errors[field]);

        if (this.form.invalid[field]) {
          this.form.isValid = false;
        }
      });
    },

    // Internal
    async validate() {
      if (this.validateForm) {
        await this.validateForm(this.form);
      }
    }
  }
};
</script>
