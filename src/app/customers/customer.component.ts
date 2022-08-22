import { Component, OnInit } from "@angular/core";
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormGroup,
  ValidatorFn,
  Validators,
} from "@angular/forms";

import { debounceTime } from "rxjs/operators";

import { Customer } from "./customer";

function emailmatcher(c: AbstractControl): { [key: string]: boolean } | null {
  const emailControl = c.get("email");
  const confirmEmailControl = c.get("confirmEmail");

  if (emailControl.pristine || confirmEmailControl.pristine) {
    return null;
  }

  if (emailControl.value === confirmEmailControl.value) {
    return null;
  }
  return { dontMatch: true };
}

function ratingRange(min: Number | null, max: Number | null): ValidatorFn {
  return (c: AbstractControl): { [key: string]: boolean } | null => {
    if (c.value && (c.value < min || c.value > max)) {
      return { range: true };
    }
    return null;
  };
}

@Component({
  selector: "app-customer",
  templateUrl: "./customer.component.html",
  styleUrls: ["./customer.component.css"],
})
export class CustomerComponent implements OnInit {
  // Variables fields
  customerForm: FormGroup;
  customer = new Customer();
  emailMessages: string;

  // getters and setters

  public get addressesArray(): FormArray {
    return <FormArray>this.customerForm.get("address");
  }

  private validationMessages = {
    r: "Field is required",
    email: "Please enter a valid email",
    confirmEmail: "Entered email doesn't match",
    firstName: "Firstname is required",
    lastname: "Lastname is required",
  };

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.customerForm = this.fb.group({
      firstName: ["", [Validators.required, Validators.minLength(3)]],
      lastName: ["", [Validators.required, Validators.minLength(5)]],
      emailGroup: this.fb.group(
        {
          email: ["", [Validators.required, Validators.email]],
          confirmEmail: ["", [ Validators.email]],
        },
        { validator: emailmatcher }
      ),
      phone: "",
      notification: "email",
      rating: ["1-7", ratingRange(1, 7)],
      sendCatalog: true,
      address: this.fb.array([this.buildAddresinstances()]),
    });

    this.customerForm.get("notification").valueChanges.subscribe((value) => {
      this.setNotification(value);
    });

    const emailGrpControl = this.customerForm.get("emailGroup.email");
    emailGrpControl.valueChanges
      .pipe(debounceTime(1000))
      .subscribe((v) => this.setValidationMessages(emailGrpControl));
  }

  addAddress(): void {
    return this.addressesArray.push(this.buildAddresinstances());
  }
  deleteLastAddress(i: FormArray): void {
    i.controls.pop();
  }

  buildAddresinstances(): FormGroup {
    return this.fb.group({
      addressType: "home",
      street1: "",
      street2: "",
      city: "",
      state: "",
      zip: "",
    });
  }
  setValidationMessages(c: AbstractControl) {
    this.emailMessages = "";

    if ((c.touched || c.dirty) && c.errors) {
      this.emailMessages = Object.keys(c.errors)
        .map((key) => this.validationMessages[key])
        .join(" ");
    }
  }

  Reset(): void {
    this.customerForm.reset();
    this.customerForm.patchValue({
      sendCatalog: true,
    });
  }

  setNotification(notifyVia: string): void {
    const phoneControl = this.customerForm.get("phone");
    if (notifyVia === "text") {
      phoneControl.setValidators(Validators.required);
    } else {
      phoneControl.clearValidators();
    }
    phoneControl.updateValueAndValidity();
  }

  save() {
    console.log(this.customerForm);
    console.log("Saved: " + JSON.stringify(this.customerForm.value));
  }
}
