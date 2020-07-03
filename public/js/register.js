$(document).ready(function() {
  $('.mdb-select').materialSelect();
});

(function() {
  validate.extend(validate.validators.datetime, {
    parse: function(value, options) {
      return +moment.utc(value);
    },
    format: function(value, options) {
      var format = options.dateOnly ? "YYYY-MM-DD" : "YYYY-MM-DD hh:mm:ss";
      return moment.utc(value).format(format);
    }
  });

  var constraints = {
    email: {
      presence: true,
      email: true
    },
    password: {
      presence: true,
      length: {
        minimum: 5
      }
    },
    "confirm-password": {
      presence: true,
      equality: {
        attribute: "password",
        message: "^The passwords does not match"
      }
    },
    username: {
      presence: true,
      length: {
        minimum: 3,
        maximum: 20
      },
      format: {
        pattern: "[a-z0-9]+",
        flags: "i",
        message: "can only contain a-z and 0-9"
      }
    },
    birthdate: {
      presence: true,
      date: {
        latest: moment().subtract(18, "years"),
        message: "^You must be at least 18 years old to use this service"
      }
    },
    country: {
      presence: true,
      inclusion: {
        within: ["SE"],
        message: "^Sorry, this service is for Sweden only"
      }
    },
    zip: {
      format: {
        pattern: "\\d{5}"
      }
    },
    "number-of-children": {
      presence: true,
      numericality: {
        onlyInteger: true,
        greaterThanOrEqualTo: 0
      }
    }
  };

  var form = document.querySelector("form#main");
  form.addEventListener("submit", function(ev) {
     if (!handleFormSubmit(form))  ev.preventDefault();
  });

  var inputs = document.querySelectorAll("input, textarea, select")
  for (var i = 0; i < inputs.length; ++i) {
    inputs.item(i).addEventListener("change", function(ev) {
      var errors = validate(form, constraints) || {};
      showErrorsForInput(this, errors[this.name])
    });
  }

  function handleFormSubmit(form, input) {
      var errors = validate(form, constraints);
  showErrors(form, errors || {});
  if (!errors) {
    showSuccess();
  }
  return !errors
  }

  function showErrors(form, errors) {
    _.each(form.querySelectorAll("input[name], select[name]"), function(input) {
      showErrorsForInput(input, errors && errors[input.name]);
    });
  }

  function showErrorsForInput(input, errors) {
    var formGroup = closestParent(input.parentNode, "form-group")
      , messages = formGroup.querySelector(".messages");
    resetFormGroup(formGroup);
    if (errors) {
      formGroup.classList.add("has-error");
      _.each(errors, function(error) {
        addError(messages, error);
      });
    } else {
      formGroup.classList.add("has-success");
    }
  }

  function closestParent(child, className) {
    if (!child || child == document) {
      return null;
    }
    if (child.classList.contains(className)) {
      return child;
    } else {
      return closestParent(child.parentNode, className);
    }
  }

  function resetFormGroup(formGroup) {
    formGroup.classList.remove("has-error");
    formGroup.classList.remove("has-success");
    _.each(formGroup.querySelectorAll(".help-block.error"), function(el) {
      el.parentNode.removeChild(el);
    });
  }

  function addError(messages, error) {
    var block = document.createElement("p");
    block.classList.add("help-block");
    block.classList.add("error");
    block.classList.add("text-danger");
    block.innerText = error;
    messages.appendChild(block);
  }

  function showSuccess() {
    alert("Success!");
  }
})();