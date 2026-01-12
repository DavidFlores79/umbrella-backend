// ABOUTME: Unit tests for S3Service to verify AWS S3 file operations
// ABOUTME: Tests presigned URL generation, file upload, copy, and delete operations

import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { S3Service } from './S3Service';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Mock AWS SDK
jest.mock('@aws-sdk/client-s3');
jest.mock('@aws-sdk/s3-request-presigner');

describe('S3Service', () => {
  let service: S3Service;
  let configService: ConfigService;
  let mockS3Client: any;

  const mockConfig = {
    AWS_REGION_NAME: 'us-east-1',
    AWS_ACCESS_KEY_ID: 'test-access-key',
    AWS_SECRET_ACCESS_KEY: 'test-secret-key',
    AWS_BUCKET_NAME: 'test-bucket',
  };

  beforeEach(async () => {
    // Mock S3Client
    mockS3Client = {
      send: jest.fn().mockResolvedValue({}),
    } as any;

    (S3Client as jest.MockedClass<typeof S3Client>).mockImplementation(
      () => mockS3Client,
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        S3Service,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => mockConfig[key]),
          },
        },
      ],
    }).compile();

    service = module.get<S3Service>(S3Service);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize S3Client with correct configuration', () => {
      expect(S3Client).toHaveBeenCalledWith({
        region: mockConfig.AWS_REGION_NAME,
        credentials: {
          accessKeyId: mockConfig.AWS_ACCESS_KEY_ID,
          secretAccessKey: mockConfig.AWS_SECRET_ACCESS_KEY,
        },
      });
    });

    it('should set bucket name from config', () => {
      expect(service.getBucketName()).toBe(mockConfig.AWS_BUCKET_NAME);
    });
  });

  describe('getSignedUploadUrl', () => {
    it('should generate presigned upload URL with default expiration', async () => {
      const key = 'test/file.jpg';
      const mockUrl = 'https://s3.amazonaws.com/presigned-upload-url';

      (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

      const result = await service.getSignedUploadUrl(key);

      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(PutObjectCommand),
        { expiresIn: 300 },
      );
      expect(result).toBe(mockUrl);
    });

    it('should generate presigned upload URL with custom expiration', async () => {
      const key = 'test/file.jpg';
      const expiresIn = 600;
      const mockUrl = 'https://s3.amazonaws.com/presigned-upload-url';

      (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

      const result = await service.getSignedUploadUrl(key, expiresIn);

      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(PutObjectCommand),
        { expiresIn },
      );
      expect(result).toBe(mockUrl);
    });
  });

  describe('getSignedDownloadUrl', () => {
    it('should generate presigned download URL with default expiration', async () => {
      const key = 'test/file.jpg';
      const mockUrl = 'https://s3.amazonaws.com/presigned-download-url';

      (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

      const result = await service.getSignedDownloadUrl(key);

      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(GetObjectCommand),
        { expiresIn: 300 },
      );
      expect(result).toBe(mockUrl);
    });

    it('should generate presigned download URL with custom expiration', async () => {
      const key = 'test/file.jpg';
      const expiresIn = 600;
      const mockUrl = 'https://s3.amazonaws.com/presigned-download-url';

      (getSignedUrl as jest.Mock).mockResolvedValue(mockUrl);

      const result = await service.getSignedDownloadUrl(key, expiresIn);

      expect(getSignedUrl).toHaveBeenCalledWith(
        mockS3Client,
        expect.any(GetObjectCommand),
        { expiresIn },
      );
      expect(result).toBe(mockUrl);
    });
  });

  describe('uploadFile', () => {
    it('should upload file buffer to S3', async () => {
      const key = 'test/file.jpg';
      const buffer = Buffer.from('test content');
      const contentType = 'image/jpeg';
      const mockETag = '"test-etag"';

      mockS3Client.send.mockResolvedValue({ ETag: mockETag } as any);

      const result = await service.uploadFile(key, buffer, contentType);

      expect(mockS3Client.send).toHaveBeenCalledWith(
        expect.any(PutObjectCommand),
      );

      expect(result).toEqual({
        etag: mockETag,
        bucket: mockConfig.AWS_BUCKET_NAME,
        key,
      });
    });
  });

  describe('copyFile', () => {
    it('should copy file within S3', async () => {
      const destinationKey = 'test/copy.jpg';
      const copySource = 'test-bucket/test/original.jpg';
      const mockETag = '"test-etag"';

      mockS3Client.send.mockResolvedValue({
        CopyObjectResult: { ETag: mockETag },
      } as any);

      const result = await service.copyFile(destinationKey, copySource);

      expect(mockS3Client.send).toHaveBeenCalled();

      expect(result).toEqual({
        etag: mockETag,
        bucket: mockConfig.AWS_BUCKET_NAME,
        key: destinationKey,
      });
    });
  });

  describe('deleteFile', () => {
    it('should delete file from S3', async () => {
      const key = 'test/file.jpg';

      mockS3Client.send.mockResolvedValue({} as any);

      await service.deleteFile(key);

      expect(mockS3Client.send).toHaveBeenCalled();
    });
  });

  describe('getClient', () => {
    it('should return S3Client instance', () => {
      const client = service.getClient();
      expect(client).toBe(mockS3Client);
    });
  });

  describe('getBucketName', () => {
    it('should return configured bucket name', () => {
      const bucketName = service.getBucketName();
      expect(bucketName).toBe(mockConfig.AWS_BUCKET_NAME);
    });
  });
});
