-- CreateTable
CREATE TABLE "farm_contacts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT,
    "lastName" TEXT,
    "mailingAddress" TEXT,
    "city" TEXT,
    "state" TEXT,
    "zipCode" INTEGER,
    "email1" TEXT,
    "email2" TEXT,
    "phoneNumber1" TEXT,
    "phoneNumber2" TEXT,
    "phoneNumber3" TEXT,
    "phoneNumber4" TEXT,
    "phoneNumber5" TEXT,
    "phoneNumber6" TEXT,
    "siteMailingAddress" TEXT,
    "siteCity" TEXT,
    "siteState" TEXT,
    "siteZipCode" INTEGER,
    "notes" TEXT,
    "farm" TEXT,
    "dateCreated" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModified" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "import_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fieldMappings" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "label_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "template" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
