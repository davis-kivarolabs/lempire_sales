export interface DataTypes {
  readonly value: string;
  readonly label: string;
}

export const specialNotes: readonly DataTypes[] = [
  { value: "Good Client", label: "Good Client" },
  { value: "ASAP", label: "ASAP" },
  { value: "Need Call", label: "Need Call" },
  { value: "Ok", label: "Ok" },
  { value: "Discussed with Albin", label: "Discussed with Albin" },
  { value: "Discussed with Rakesh", label: "Discussed with Rakesh" },
  { value: "Call Today Itself", label: "Call Today Itself" },
  { value: "Message Only- Good Client", label: "Message Only- Good Client" },
  { value: "Client Reference", label: "Client Reference" },
  { value: "Relation Reference", label: "Relation Reference" },
  { value: "Other Reference", label: "Other Reference" },
  { value: "Leave It", label: "Leave It" },
];

export const colourOptions: readonly DataTypes[] = [
  { value: "GOOD", label: "GOOD" },
  { value: "NEED FOLLOW UP", label: "NEED FOLLOW UP" },
  { value: "INTERIOR", label: "INTERIOR" },
  { value: "NEGATIVE", label: "NEGATIVE" },
];

export const scopeOptions: readonly DataTypes[] = [
  { value: "Home construction", label: "Home construction" },
  { value: "Interior", label: "Interior" },
  { value: "Renovation", label: "Renovation" },
  { value: "Designing", label: "Designing" },
  { value: "Design & Construction", label: "Designing & Construction" },
  { value: "Landscaping", label: "Landscaping" },
  { value: "Just enquiry", label: "Just enquiry" },
  { value: "Dealers", label: "Dealers" },

  // { value: "To Design", label: "To Design" },
  // { value: "Design Completed", label: "Design Completed" },
  // { value: "Construction", label: "Construction" },
  // { value: "Interior", label: "Interior" },
  // { value: "Landscaping", label: "Landscaping" },
  // { value: "Just Inquiry", label: "Just Inquiry" },
  // { value: "Dealer/Suppliers", label: "Dealer/Suppliers" },
];

export const startingTime: readonly DataTypes[] = [
  { value: "By Other- Planning Prog", label: "By Other- Planning Prog" },
  { value: "Planning Progressing", label: "Planning Progressing" },
  { value: "Immediate", label: "Immediate" },
  { value: "1 Months", label: "1 Months" },
  { value: "3 Months", label: "3 Months" },
  { value: "6 Months", label: "6 Months" },
  { value: "After 6 Months", label: "After 6 Months" },
];

export const districts: readonly DataTypes[] = [
  { value: "Kasaragod", label: "Kasaragod" },
  { value: "Kannur", label: "Kannur" },
  { value: "Wayanad", label: "Wayanad" },
  { value: "Kozhikode", label: "Kozhikode" },
  { value: "Malappuram", label: "Malappuram" },
  { value: "Palakkad", label: "Palakkad" },
  { value: "Thrissure", label: "Thrissur" },
  { value: "Eranakulam", label: "Eranakulam" },
  { value: "Kottayam", label: "Kottayam" },
  { value: "Alppuzha", label: "Alappuzha" },
  { value: "Idukki", label: "Idukki" },
  { value: "Pathanamthitta", label: "Pathanamthitta" },
  { value: "Kollam", label: "Kollam" },
  { value: "Thiruvananthapuram", label: "Thiruvananthapuram" },
];

export const rooms: readonly DataTypes[] = [
  { value: "1BHK", label: "1BHK" },
  { value: "2BHK", label: "2BHK" },
  { value: "3BHK", label: "3BHK" },
  { value: "4BHK", label: "4BHK" },
  { value: "5BHK", label: "5BHK" },
  { value: "Above 5BHK", label: "Above 5BHK" },
];

export const projectSize: readonly DataTypes[] = [
  { value: "500 sqft", label: "500 sqft" },
  { value: "1000 sqft", label: "1000 sqft" },
  { value: "1500 sqft", label: "1500 sqft" },
  { value: "2000 sqft", label: "2000 sqft" },
  { value: "2500 sqft", label: "2500 sqft" },
  { value: "3000 sqft", label: "3000 sqft" },
  { value: "Above 4000 sqft", label: "Above 4000 sqft" },
];

export const plotSize: readonly DataTypes[] = [
  { value: "5 Cent", label: "5 Cent" },
  { value: "10 Cent", label: "10 Cent" },
  { value: "15 Cent", label: "15 Cent" },
  { value: "20 Cent", label: "20 Cent" },
  { value: "25 Cent", label: "25 Cent" },
  { value: "Above 25 Cent", label: "Above 25 Cent" },
];
