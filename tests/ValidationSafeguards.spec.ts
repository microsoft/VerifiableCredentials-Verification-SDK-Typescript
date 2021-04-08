import { ValidationSafeguards } from "../lib";


describe('ValidationSafeguards', () => {
  it('should instantiate', () => {
    let safeguards = new ValidationSafeguards();
    expect(safeguards.maxNumberOfIdTokensInSiop).toEqual(5);
    expect(safeguards.maxNumberOfVCTokensInPresentation).toEqual(1);
    expect(safeguards.maxNumberOfVPTokensInSiop).toEqual(10);
    expect(safeguards.maxSizeOfIdToken).toEqual(16*1024*1024);
    expect(safeguards.maxSizeOfVCTokensInPresentation).toEqual(16*1024*1024);
    expect(safeguards.maxSizeOfVPTokensInSiop).toEqual(16*1024*1024);

    // set individual props
    safeguards = new ValidationSafeguards({maxNumberOfIdTokensInSiop: 10});
    expect(safeguards.maxNumberOfIdTokensInSiop).toEqual(10);
    safeguards = new ValidationSafeguards({maxNumberOfVCTokensInPresentation: 20});
    expect(safeguards.maxNumberOfVCTokensInPresentation).toEqual(20);
    safeguards = new ValidationSafeguards({maxNumberOfVPTokensInSiop: 30});
    expect(safeguards.maxNumberOfVPTokensInSiop).toEqual(30);
    safeguards = new ValidationSafeguards({maxSizeOfIdToken: 1000});
    expect(safeguards.maxSizeOfIdToken).toEqual(1000);
    safeguards = new ValidationSafeguards({maxSizeOfVCTokensInPresentation: 2000});
    expect(safeguards.maxSizeOfVCTokensInPresentation).toEqual(2000);
    safeguards = new ValidationSafeguards({maxSizeOfVPTokensInSiop: 3000});
    expect(safeguards.maxSizeOfVPTokensInSiop).toEqual(3000);
  });

  it('should modify state', () => {
    let safeguards = new ValidationSafeguards();
    safeguards.maxNumberOfIdTokensInSiop = 20;
    expect(safeguards.maxNumberOfIdTokensInSiop).toEqual(20);
    safeguards.maxNumberOfVCTokensInPresentation = 25;
    expect(safeguards.maxNumberOfVCTokensInPresentation).toEqual(25);
    safeguards.maxNumberOfVPTokensInSiop = 30;
    expect(safeguards.maxNumberOfVPTokensInSiop).toEqual(30);
    safeguards.maxSizeOfIdToken = 40;
    expect(safeguards.maxSizeOfIdToken).toEqual(40);
    safeguards.maxSizeOfVCTokensInPresentation = 50;
    expect(safeguards.maxSizeOfVCTokensInPresentation).toEqual(50);
    safeguards.maxSizeOfVPTokensInSiop = 60;
    expect(safeguards.maxSizeOfVPTokensInSiop).toEqual(60);
  });
});