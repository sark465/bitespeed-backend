import express from 'express';
import { PrismaClient } from '@prisma/client';

export const identifyRouter = express.Router();
const prisma = new PrismaClient();

type IdentifyRequest = {
  email?: string | null;
  phoneNumber?: string | null;
};

identifyRouter.post('/', async (req, res) => {
  const { email, phoneNumber } = req.body as IdentifyRequest;

  if (!email && !phoneNumber) {
    return res.status(400).json({ error: 'email or phoneNumber required' });
  }

  const contacts = await prisma.contact.findMany({
    where: {
      OR: [
        email ? { email } : undefined,
        phoneNumber ? { phoneNumber } : undefined,
      ].filter(Boolean) as any[],
    },
    orderBy: { createdAt: 'asc' },
  });

  if (contacts.length === 0) {
    const newContact = await prisma.contact.create({
      data: {
        email: email ?? null,
        phoneNumber: phoneNumber ?? null,
        linkPrecedence: 'primary',
      },
    });

    return res.status(200).json({
      contact: {
        primaryContactId: newContact.id,
        emails: newContact.email ? [newContact.email] : [],
        phoneNumbers: newContact.phoneNumber ? [newContact.phoneNumber] : [],
        secondaryContactIds: [],
      },
    });
  }

  const primaryContact = contacts.find(c => c.linkPrecedence === 'primary') ?? contacts[0];
  const primaryId = primaryContact.linkPrecedence === 'primary' ? primaryContact.id : primaryContact.linkedId!;

  const linkedContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { id: primaryId },
        { linkedId: primaryId },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  const emailsSet = new Set<string>();
  const phonesSet = new Set<string>();
  let foundEmail = false;
  let foundPhone = false;

  linkedContacts.forEach((c) => {
    if (c.email) emailsSet.add(c.email);
    if (c.phoneNumber) phonesSet.add(c.phoneNumber);
  });

  if (email && emailsSet.has(email)) foundEmail = true;
  if (phoneNumber && phonesSet.has(phoneNumber)) foundPhone = true;

  if ((email && !foundEmail) || (phoneNumber && !foundPhone)) {
    const newSecondary = await prisma.contact.create({
      data: {
        email: email ?? null,
        phoneNumber: phoneNumber ?? null,
        linkedId: primaryId,
        linkPrecedence: 'secondary',
      },
    });

    linkedContacts.push(newSecondary);

    const earliestContact = [...linkedContacts].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
    )[0];

    if (earliestContact.id !== primaryId) {
      await prisma.contact.update({
        where: { id: primaryId },
        data: { linkPrecedence: 'secondary', linkedId: earliestContact.id },
      });

      await prisma.contact.update({
        where: { id: earliestContact.id },
        data: { linkPrecedence: 'primary', linkedId: null },
      });
    }
  }

  const finalContacts = await prisma.contact.findMany({
    where: {
      OR: [
        { id: primaryId },
        { linkedId: primaryId },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });

  const finalPrimary = finalContacts.find(c => c.linkPrecedence === 'primary')!;
  const secondaryContacts = finalContacts.filter(c => c.linkPrecedence === 'secondary');

  const emails = [finalPrimary.email].filter(Boolean) as string[];
  const phoneNumbers = [finalPrimary.phoneNumber].filter(Boolean) as string[];

  secondaryContacts.forEach(c => {
    if (c.email && !emails.includes(c.email)) emails.push(c.email);
    if (c.phoneNumber && !phoneNumbers.includes(c.phoneNumber)) phoneNumbers.push(c.phoneNumber);
  });

  return res.status(200).json({
    contact: {
      primaryContactId: finalPrimary.id,
      emails,
      phoneNumbers,
      secondaryContactIds: secondaryContacts.map(c => c.id),
    },
  });
});
