import { Crypto } from '../index';
import base64url from 'base64url';
import OperationType from '@decentralized-identity/sidetree/dist/lib/core/enums/OperationType';
import CreateOperation from '@decentralized-identity/sidetree/dist/lib/core/versions/latest/CreateOperation';
import Multihash from '@decentralized-identity/sidetree/dist/lib/core/versions/latest/Multihash';
const canonicalize = require('canonicalize');

/**
 * Helper class to work with long form DID's
 */
export default class LongFormDid {
  constructor(private crypto: Crypto) { }

  /**
   * Create key and return longform
   * @param keyReference Reference to the key
   */
  public async create(keyReference: string): Promise<string> {
    // See https://github.com/diafygi/webcrypto-examples for examples how to use the W3C web Crypto stamdard
    // Generate the signing key
    let key: any = await this.crypto.builder.subtle.generateKey(
      <EcKeyGenParams>{
        name: 'ECDSA',
        namedCurve: 'secp256k1'
      },
      true,
      ['sign', 'verify']
    );
    const signingPrivate: any = await this.crypto.builder.subtle.exportKey('jwk', key.privateKey);
    const signingPublic = this.normalizeJwk(await this.crypto.builder.subtle.exportKey('jwk', key.publicKey));
    
    // Generate recovery key
    key = await this.crypto.builder.subtle.generateKey(
      <EcKeyGenParams>{
        name: 'ECDSA',
        namedCurve: 'secp256k1'
      },
      true,
      ['sign', 'verify']
    );
    const recoveryPrivate: any = await this.crypto.builder.subtle.exportKey('jwk', key.privateKey);
    const recoveryPublic = this.normalizeJwk(await this.crypto.builder.subtle.exportKey('jwk', key.publicKey));
    delete (<any>recoveryPublic).key_ops;
    delete (<any>recoveryPublic).ext;

    // Store key
    await this.crypto.builder.keyStore.save(keyReference, signingPrivate);
    await this.crypto.builder.keyStore.save('recovery', recoveryPrivate);

    // Create long-form did
    const createOperationData = await this.generateCreateOperation(recoveryPublic, signingPublic, keyReference);
    const didMethodName = 'ion';
    const didUniqueSuffix = createOperationData.createOperation.didUniqueSuffix;
    const shortFormDid = `did:${didMethodName}:${didUniqueSuffix}`;
    const encodedSuffixData = createOperationData.createOperation.encodedSuffixData;
    const encodedDelta = createOperationData.createOperation.encodedDelta;
    const longFormDid = `${shortFormDid}?-ion-initial-state=${encodedSuffixData}.${encodedDelta}`;

    // const did = await Did.create(longFormDid, didMethodName);
    return longFormDid;
  };


  /**
   * Generates an create operation.
   */
  public async generateCreateOperation(recoveryPublicKey: any, signingPublicKey: any, keyReference: string) {

    const operationRequest = this.generateCreateOperationRequest(
      recoveryPublicKey,
      signingPublicKey,
      keyReference
    );
    const operationBuffer = Buffer.from(JSON.stringify(operationRequest));
    const createOperation = await CreateOperation.parse(operationBuffer);

    return {
      createOperation,
      operationRequest,
      recoveryPublicKey,
      signingPublicKey
    };
  }

  /**
   * Generates a reveal value and commitment hash as encoded strings for use in opertaions.
   * @returns [revealValueEncodedString, commitmentValueHashEncodedString]
   */
  public async generateCommitRevealPair(): Promise<[string, string]> {
    const secretKey = await this.crypto.builder.subtle.generateKey(<AesKeyGenParams>{ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    const randomBytes =  await this.crypto.builder.subtle.exportKey('jwk', <any>secretKey);
    const revealValueEncodedString = (<any>randomBytes).k;
    const commitmentHash = Multihash.hash(base64url.toBuffer(revealValueEncodedString), 18); //sha-256
    const commitmentHashEncodedString = base64url.encode(commitmentHash);
    return [revealValueEncodedString, commitmentHashEncodedString];
  }

  
  /**
   * Canonicalize the given content, then multihashes the result using the lastest supported hash algorithm, then encodes the multihash.
   * Mainly used for testing purposes.
   */
  public static canonicalizeThenHashThenEncode (content: object) {
    const contentBuffer = LongFormDid.canonicalizeAsBuffer(content);
    const contentHash = Multihash.hash(contentBuffer, 18);
    const contentHashEncodedString = base64url.encode(contentHash);
    return contentHashEncodedString;
  }

   /**
   * Canonicalizes the given content as a UTF8 buffer.
   */
  public static canonicalizeAsBuffer (content: object): Buffer {
    const canonicalizedString: string = canonicalize(content);
    const contentBuffer = Buffer.from(canonicalizedString);
    return contentBuffer;
  }

  /**
 * Generates a create operation request.
 * @param nextRecoveryCommitment The encoded commitment hash for the next recovery.
 * @param nextUpdateCommitment The encoded commitment hash for the next update.
 */
  public generateCreateOperationRequest(
    recoveryPublicKey: any,
    signingPublicKey: any,
    keyReference: string) {

    const publicKey = {
      id: keyReference,
      type: "EcdsaSecp256k1VerificationKey2019",
      jwk: signingPublicKey,
      purpose: [
        "auth",
        "general"
      ]
    }
    const document = {
      public_keys : [publicKey]
    };

    const patches = [{
      action: 'replace',
      document
    }];

    const updateCommitment = LongFormDid.canonicalizeThenHashThenEncode(signingPublicKey);
    const delta = {
      update_commitment: updateCommitment,
      patches
    };

    const deltaBuffer = Buffer.from(JSON.stringify(delta));
    const deltaHash = base64url.encode(Multihash.hash(deltaBuffer));

    const recoveryCommitment =  LongFormDid.canonicalizeThenHashThenEncode(recoveryPublicKey);
    const suffixData = {
      delta_hash: deltaHash,
      recovery_commitment: recoveryCommitment
    };

    const suffixDataEncodedString = base64url.encode(JSON.stringify(suffixData));
    const deltaEncodedString = base64url.encode(deltaBuffer);
    const operation = {
      type: OperationType.Create,
      suffix_data: suffixDataEncodedString,
      delta: deltaEncodedString
    };

    return operation;
  }

  private normalizeJwk(key: any) {
    delete key.key_ops;
    delete key.ext;
    key.crv = 'secp256k1';
    return key;
  }
}