import { LightningElement, track, api, wire } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import { getRecord } from 'lightning/uiRecordApi';
import RECORDTYPEID from '@salesforce/schema/TR1__Job__c.RecordTypeId';
import getPortalUserDetails from '@salesforce/apex/getPortalUserDetails.getUsers';
import JOB_DESC from '@salesforce/schema/TR1__Job__c.TR1__Client_Job_Description__c'
import NHS_Website_Image from '@salesforce/resourceUrl/NHS_Building_Image'

//Apex Imports
import getJobData from '@salesforce/apex/getJobDetailRecordId.getJobDetail';

const _FIELDS = [RECORDTYPEID];

export default class JobDetailPage extends NavigationMixin(LightningElement) {
  @api recordId;
  @api record;
  @api recordTypeName;
  @api details = false;
  @api open;
  @api label;
  @api docOpen;
  @api emergencyOpen;
  @api contactOpen;
  @track error;
  @track currentStep = "1";
  @track fullPhotoUrl;
  @track isModalOpen = false;
  @track mapMarkers;
  @track applied = false;
  @track finished = false;

  nhsImage = NHS_Website_Image;

  Fields = [JOB_DESC];

  strName;
  strAccountNumber;
  strPhone;

  // Change Handlers.
  nameChangedHandler(event) {
    this.strName = event.target.value;
  }
  numberChangedHandler(event) {
    this.strAccountNumber = event.target.value;
  }
  phoneChangedHandler(event) {
    this.strPhone = event.target.value;
  }

  // Insert record.
  createAccount() {
    // Creating mapping of fields of Account with values
    var fields = { 'Name': this.strName, 'AccountNumber': this.strAccountNumber, 'Phone': this.strPhone };
    // Record details to pass to create method with api name of Object.
    var objRecordInput = { 'apiName': 'Account', fields };
    // LDS method to create record.
    createRecord(objRecordInput).then(response => {
      alert('Account created with Id: ' + response.id);
    }).catch(error => {
      alert('Error: ' + JSON.stringify(error));
    });
  }

  openModal() {
    // to open modal set isModalOpen tarck value as true
    this.isModalOpen = true;
  }

  closeModal() {
    // to close modal set isModalOpen tarck value as false
    this.isModalOpen = false;
    this.applied = false;
    this.finished = false;
  }

  connectedCallback() {
    this.details = true;
  }

  @wire(getRecord, { recordId: '$recordId', fields: _FIELDS })
  wiredAccount({ error, data }) {
    if (data) {
      this.record = data;
      console.log("Job Data: ", data);
      this.recordTypeName = data.recordTypeInfo.name;
      this.error = undefined;
    } else if (error) {
      this.error = error;
      console.log(`recordTile Error: `, error);
      this.record = undefined;
    }
  }

  connectedCallback() {
    if (this.record) {
      this.mapMarkers = [
        {
          location: {
            Latitude: this.record.TR1__Account__r.BillingLatitude,
            Longitude: this.record.TR1__Account__r.BillingLongitude,
          },
        },
      ];
      switch (this.record.TR1__Most_Advanced_Stage__c) {
        case "Send Out":
          this.currentStep = "1"
          break;
        case "Application":
          this.currentStep = "2"
          break;
        case "Interview":
          this.currentStep = "3"
          break;
        case "Closing Report":
          this.currentStep = "5"
          break;
      }
    }
  }

  // @wire(getUsers, { recordId: '$record.OwnerId' })
  // wiredAccount({ error, data }) {
  //   if (data) {
  //     let [_object] = data 
  //     this.fullPhotoUrl = `${_object.FullPhotoUrl.split("/sfsites/c/").pop()}`;
  //     console.log(`User Photo URL`, this.fullPhotoUrl);
  //     this.error = undefined;
  //   } else if (error) {
  //     this.error = error;
  //     console.log(`recordTile Error: `, error);
  //     this.record = undefined;
  //   }
  // }

  @wire(getPortalUserDetails, { recordId: '$record.OwnerId' })
  userDataReturned({ error, data }) {
    if (data) {
      let [_object] = data
      console.log(`candidateHomeContainer Data: `, data);
      if (_object) {
        if (_object.FullPhotoUrl) {
          this.fullPhotoUrl = `${_object.FullPhotoUrl.split("/sfsites/c/").pop()}`;
          console.log(`User Photo URL`, this.fullPhotoUrl);
        } else {
          this.fullPhotoUrl = "https://i.imgur.com/CpuY6JY.jpg";
        }
      } else {
        this.fullPhotoUrl = "https://i.imgur.com/CpuY6JY.jpg"
      }
      this.error = undefined;
    } else if (error) {
      this.error = error;
      console.log(`recordTile Error: `, error);
      this.record = undefined;
    }
  }

  @wire(getJobData, { recordId: '$recordId' })
  returnedData({ error, data }) {
    if (data) {
      this.record = data[0];
      console.log(`jobDetail returned data: `, this.record);
      this.error = undefined;
    } else if (error) {
      this.error = error;
      console.log(`recordTile Error: `, error);
      this.record = undefined;
    }
  }

  tileClick() {
    console.log(`tileClick: `, JSON.parse(JSON.stringify(this.record)));
    const job = JSON.parse(JSON.stringify(this.record));
    const event = new CustomEvent('tileclick', {
      // detail contains only primitives
      detail: job
    });
    // Fire the event from c-tile
    this.dispatchEvent(event);
  }

  expandDetails() {
    if (this.details) {
      this.details = false;
    } else {
      this.details = true;
    }
  }

  applyToJob(event) {
    console.log("Apply To Job was clicked: ", event)
    this.applied = true;
  }

  appliedToJob(event) {
    this.finished = true;
  }

  get acceptedFormats() {
    return ['.pdf', '.png', '.jpg'];
  }

  handleUploadFinished(event) {
    this.connectedCallback();
  }

  get sectionClass() {
    return this.open ? 'slds-section slds-is-open' : 'slds-section';
  }

  get docSection() {
    return this.docOpen ? 'slds-section slds-is-open' : 'slds-section';
  }

  get sectionDetailsClass() {
    return this.contactOpen ? 'slds-section slds-is-open' : 'slds-section';
  }

  get emergencyDetailsClass() {
    return this.emergencyOpen ? 'slds-section slds-is-open' : 'slds-section'
  }

  connectedCallback() {
    if (typeof this.open === 'undefined') this.open = true;
    this.label = `My Details`
  }

  handleClick() {
    this.open = !this.open;
  }

  handleEmergencyClick() {
    this.emergencyOpen = !this.emergencyOpen;
  }

  handleContactClick() {
    this.contactOpen = !this.contactOpen;
  }

  handleDocClick() {
    this.docOpen = !this.docOpen;
  }

  navigateToRegisterPage() {
    this[NavigationMixin.Navigate]({
      type: 'comm__namedPage',
      attributes: {
        name: 'Register'
      }
    });
  }

}