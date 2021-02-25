/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

 export default class ErrorHelpers {
   /**
    * 
    * @param prefix for the error code
    * @param errorNumber for the error code
    * @param size of the errorNumber, defaults to two digits
    */
   public static errorCode(prefix: string, errorNumber: number, size: number = 2): string {
    const paddedErrorNumber = (errorNumber + '').padStart(size, '0');
    return prefix + paddedErrorNumber;
   }
 }