// module imports
// import {
//   S3Client,
//   // DeleteObjectCommand,
//   // CopyObjectCommand,
// } from "@aws-sdk/client-s3";
import multer from "multer";
// import multerS3 from "multer-s3";
import { v4 } from "uuid";
import mime from "mime-types";
import path from "path";

// file imports
import { ENVIRONMENT_VARIABLES } from "../configs/enum";
import { requireEnv } from "../configs/helper";

class AwsS3Manager {
  private static instance: AwsS3Manager;

  private readonly bucket = requireEnv(ENVIRONMENT_VARIABLES.AWS_BUCKET_NAME);
  // private readonly s3 = new S3Client({
  //   credentials: {
  //     accessKeyId: requireEnv(ENVIRONMENT_VARIABLES.AWS_ACCESS_KEY),
  //     secretAccessKey: requireEnv(ENVIRONMENT_VARIABLES.AWS_SECRET_KEY),
  //   },
  //   region: requireEnv(ENVIRONMENT_VARIABLES.AWS_REGION),
  // });

  constructor() {
    if (!AwsS3Manager.instance) {
      AwsS3Manager.instance = this;
    }
    return AwsS3Manager.instance;
  }

  /**
   * @description upload image to s3 bucket
   * @returns {Object} file object <req.file>
   */
  upload = multer({
    // storage: multerS3({
    //   s3: this.s3,
    //   contentType: multerS3.AUTO_CONTENT_TYPE,
    //   bucket: this.bucket,
    //   metadata: (req: any, file: any, cb: any) => {
    //     cb(null);
    //   },
    //   key: (req: any, file: any, cb: any) => {
    //     const fileExtension = "." + mime.extension(file.mimetype);
    //     cb(null, v4() + fileExtension);
    //   },
    // }),
  });

  /**
   * @description delete s3 bucket object
   * @param {string} filePath path to file
   * @returns {Object} data of deleted object
   */
  async delete(path: string) {
    if (!path) return null;
    const keyArray = path.split("/");
    const key = keyArray[keyArray.length - 1];
    const input = { Bucket: this.bucket, Key: key };
    // const command = new DeleteObjectCommand(input);
    // return await this.s3.send(command);
  }

  /**
   * @description copy s3 bucket object
   * @param {string} sourceFile path to source file
   * @returns {Object} data of copied object
   */
  async copy(sourceFile: string) {
    const key = v4() + path.extname(sourceFile);
    const input = {
      Bucket: this.bucket,
      CopySource: sourceFile,
      Key: key,
    };
    // const command = new CopyObjectCommand(input);
    // const data = await this.s3.send(command);
    // return { ...data, key };
  }
}

export default new AwsS3Manager();
// Object.freeze(new AwsS3Manager());
