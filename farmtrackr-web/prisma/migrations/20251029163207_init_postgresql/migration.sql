-- CreateTable
CREATE TABLE "farm_contacts" (
    "id" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "farm" TEXT,
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
    "dateCreated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateModified" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "farm_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "import_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fieldMapping" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "import_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "label_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "template" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "label_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "content" TEXT,
    "fileUrl" TEXT,
    "contactId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "documents_pkey" PRIMARY KEY ("id")
);
