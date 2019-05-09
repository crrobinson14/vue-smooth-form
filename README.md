# vue-smooth-form

Asynchronous form handling library for VueJS.

## Alternatives

This module was inspired by [https://github.com/jaredpalmer/formik](Formik) and [https://github.com/blocka/vue-simpleform](vue-simpleform).
Formik is the well-known form handling library for React, and `vue-simpleform` is its closest counterpart for VueJS. However, it has two
problems that prevented me (and possibly you) from using it:

1. It didn't work with custom form controls such as those in Vuetify, the Material-Design component library for Vue. Many Vuetify form
controls pass raw strings in their events, and `vue-simpleform` is hard-coded to expect HTML DOM `Event` objects for all event callbacks.

2. I would have filed a pull request to fix this, but `vue-simpleform` appears to be no longer actively maintained. There are two open
pull requests that have not been addressed and it is still in its 0.0.13 version at this time.

## Basic Usage

```html
<template>
  <vue-smooth-form v-slot="{form}" :initial-values="initialValues" :validate-form="validate">
    <!-- Vuetify controls pass raw strings in their event handlers. Use this syntax for passing along their values. -->
    <v-text-field
      type="email"
      @blur="form.onBlur"
      @change="form.onChange('email', $event)"
      @input="form.onInput('email', $event)"
      name="email"
      :value="form.values.email"
      :error-messages="form.touched.email && form.errors.email || ''"
      autocomplete="email"
      label="Email address..."/>

    <!-- Standard HTML form control events can be passed directly -->
    <input 
      type="password" 
      @blur="form.onBlur"
      @change="form.onChange"
      @input="form.onInput"
      name="password" 
      :value="form.values.password" />

    <v-btn color="primarylight" :disabled="form.isSubmitting || !form.isValid" @click.prevent="login(form)">Login</v-btn>
    <v-btn color="primarylight" :disabled="form.isSubmitting || !form.isValid" @click.prevent="form.resetForm">Reset</v-btn>

    <v-btn flat :disabled="form.submitting">Forgot Password</v-btn>
  </vue-smooth-form>
</template>

<script>
    import VueSmoothForm from 'vue-smooth-form';
    import API from './api';
    
    export default {
        components: { VueSmoothForm },
        data () {
            return {
                initialValues: {
                    email: '',
                    password: '',
                }
            }
        },
        methods: {
            // Form action handlers can be whatever we want. 
            async login(form) {
                form.setSubmitting(true);

                try {
                    const result = await API.login(form.values);
                    console.log('login result', result);
                    form.resetForm();
                } catch (e) {
                    alert(e.message);
                }
              
                form.setSubmitting(false);
            },
        
            // The validation routine receivs a reference to the form. We destructure here and pull out the only properties we need.
            // values contains the field values, and setFormErrors is a utility method to set all the error states on the form.
            async validate({ values, setFormErrors }) {
              if (this.validationAbort) {
                this.validationAbort.abort();
                this.validationAbort = null;
              }
        
              this.validationAbort = new AbortController();
        
              try {
                const result = await API.validateForm('login', values, this.validationAbort.signal);
                if (result) {
                  // We can arrive here with a null result if we aborted a request
                  setFormErrors(result.errors);
                }
              } catch (e) {
                console.log('Validation error', e);
              }
        
              this.validationAbort = null;
            },
        },
    }
</script>
```

## Details

This library provides a simple wrapper component called `vue-smooth-form`. It initializes a local `values` object from a set of initial
values provided by the parent component, then passes a reference to itself (with useful methods, properties, and events) to its children
via a slot binding. Simply wire each input field to the values, errors, and event handlers via that reference.

### Input Field Event Handlers

  `form.onBlur` - Connect this to the `@blur` event for each input field. Sets the field to "touched". 
  `form.onChange` - Connect this to the `@change` event for each input field. Sets the field to "dirty". 
  `form.onInput` - Connect this to the `@input` event for each input field. Sets the field to "touched" and "dirty".
  
Note that all three event handlers may be called with one of two patterns:

  `form.onChange(fieldName, value)` - For cases where you have a raw string or other value to pass
  `form.onChange($event)` - For cases where you have an HTML DOM event. The field name will be taken from `event.target.name`, so ensure
    that your input field has a name attribute.

### Form Properties

  `form.values` - { field: error } map of current field values
  `form.errors` - { field: error } map of error strings as set by the validation function 

  `form.isValid` - True if the entire form is valid (no fields have errors). Just a shortcut for checking if the `errors` object is empty.
  `form.isSubmitting` - True if the form is being submitted, as set by `form.setSubmitting()`. Useful for disabling buttons.

  `form.valid` - { field: isValid } map of booleans identifying valid fields (those with no errors)
  `form.invalid` - { field: isValid } map of booleans identifying invalid fields
  `form.untouched` - { field: isValid } map of booleans identifying untouched fields (those that have never received focus)  
  `form.touched` - { field: isValid } map of booleans identifying touched fields 
  `form.pristine` - { field: isValid } map of booleans identifying pristine fields (those that have not been modified)
  `form.dirty` - { field: isValid } map of booleans identifying dirty fields 

### Support Methods

  `form.setSubmitting(true|false)` - Set the `isSubmitting` status for the form
  `form.resetForm()` - Reset all `values{}` back to `initialValues{}`.
  `form.setFieldValue(field, value)` - Set `field` to `value`.
  `form.setFieldError(field, error)` - Set the error status for a field. Set error to `null` to clear an error.
  `form.setFieldTouched(field, true|false)` - Set the `touched` and `untouched` statuses for a field
  `form.setFieldDirty(field, true|false)` - Set the `dirty` and `pristine` statuses for a field
  `form.setFormErrors(errors)` - Set all errors on a form. The parameter should be a dictionary of fields with error strings or `null`.

### Validation and Submission

Unlike other form handling libraries, `vue-smooth-form` does not try to handle submit events for you. Just create whatever buttons, links,
or other controls you want to handle this. Typically you would use the `form.setSubmitting()` method as shown above, but only as a
convenience if you want to disable certain controls (like the submit button) during the submit call to the server.

Validation is done automatically whenever a field's value changes, or the field loses focus. Validation may be asynchronous, and
`vue-smooth-form` will wait for it to complete. However, note that rapid data entry by the user may trigger this callback many times. If you
want to be kind to your server, consider using a cancelable request using `AbortController`. An example of this is shown above.
