/**
 * De-identified noisy paste fixture — mimics HTML form chrome without real PII.
 * Do not place real client identifiers in source control.
 */

import type { ExtractedIntake } from '../../../src/clinical-intelligence/lib/intakeExtraction';
import { emptyExtractedIntake } from '../../../src/clinical-intelligence/lib/intakeExtraction';

/** Pasted form noise: labels, asterisks, Yes/No pairs, rating lists, UI chrome, truncation. */
export const SYNTHETIC_NOISY_INTAKE_PASTE = `
Pathfinder Client Intake Form

Full Name*
Alex Morgan

Preferred Name*
Alex

Pronouns*
(He/Him, She/Her, They/Them)
They/Them

Date of Birth*
03/14/1985

Current Age*
40

Home Address*
Address
12 Example Street
Lisbon

Telephone*
Number*
+351900111222

Permission to call / leave message
No
Yes

Email*
Address
alex.morgan.synthetic@example.test

Permission to email
Yes
No

GP Practice*
N/A

Relationship Status*
Married

Referral source
FRIEND

Why this therapist was chosen
A friend recommended Pathfinder after a difficult year. I want practical help with communication and anxiety.

Main problems to resolve
Marriage of 12 years in crisis / possible separation, childhood patterns, emotional avoidance, defensiveness, severe anxiety, poor sleep, intrusive thoughts, sadness and hopelessness. I am seeking therapy because I want to become a healthier, e

Current severity 1–10
1
2
3
4
5
6
7
8
9
10

Therapy goals
- heal unresolved childhood experiences and understand current impact
- develop emotional regulation and secure sense of self
- become more emotionally available / authentic in relationships

Physical health 1–10
1
2
3
4
5
6
7
8
9
10

Diagnosed health conditions
None

Medication
None

Current investigations
No
Yes

Chronic pain
No
Yes

Previous therapy
Yes — prior therapy including ACT, anxiety/stress management, relationship work and attachment exploration.

Sleep problems
No
Yes

Sleep rating
1
2
3
4
5
6
7
8
9
10

Exercise
2-3
Running
Kettlebell
Bands
Jiu-jitsu
Tennis

Food / appetite / weight / body image
Stress currently contributing to skipped meals / not preparing food.

Depression / grief / sadness
Significant grief/sadness/depressive symptoms related to marriage crisis and possible separation, with poor sleep, anxiety and periods of hopelessness.

Anxiety / panic / phobias
Severe anxiety with intrusive thoughts.

Alcohol / recreational drug use
No
Yes

Romantic relationship
13 married, 18 total years together

Household
Me, partner, and 10 year old child

Occupation
Self-employed

Childhood
Unstable home, emotional neglect, trauma, emotional suppression, independence and prioritising others. Learned to handle problems alone.

Trauma
Parent injury, house fire, parental fighting.

Five words describing self
Loyal
Strong
Kind
Big heart
Tenacious
Funny

Most important thing in life
My family and dogs.

Strengths
Motivated to change; values family; exercises regularly; reflective; previous therapy engagement.

Weaknesses
Defensiveness, withdrawal, difficulty asking for help, fixing/solution focus, anxiety, self-doubt and overthinking.

Save & Continue
Save & Exit
Cancel
Thankyou for completing your intake form.
`.trim();

/** Expected document extraction for the synthetic noisy paste (as if Intake Reader succeeded). */
export function expectedSyntheticNoisyExtraction(): ExtractedIntake {
  const base = emptyExtractedIntake();
  return {
    ...base,
    personalInformation: {
      ...base.personalInformation,
      fullName: 'Alex Morgan',
      preferredName: 'Alex',
      pronouns: 'They/Them',
      dateOfBirth: '03/14/1985',
      currentAge: 40,
      homeAddress: '12 Example Street\nLisbon',
      telephone: '+351900111222',
      permissionToCall: null,
      email: 'alex.morgan.synthetic@example.test',
      permissionToEmail: null,
    },
    referralInformation: {
      gpPractice: 'N/A',
      relationshipStatus: 'Married',
      referralSource: 'FRIEND',
      whyThisTherapist:
        'A friend recommended Pathfinder after a difficult year. I want practical help with communication and anxiety.',
    },
    presentingProblem: {
      summary:
        'I have been experiencing severe anxiety. Marriage of 12 years in crisis / possible divorce — partner wants a divorce. Childhood patterns, emotional avoidance, defensiveness, poor sleep (3–4 hours per night), intrusive thoughts, sadness and hopelessness. I am seeking therapy because I want to become a healthier, e',
      severity: null,
    },
    goals: {
      therapyGoals: [
        'heal unresolved childhood experiences and understand current impact',
        'develop emotional regulation and secure sense of self',
        'become more emotionally available / authentic in relationships',
        'improve communication',
        'create greater emotional safety in relationships',
      ],
    },
    medicalHistory: {
      physicalHealthRating: null,
      diagnosedConditions: ['None'],
      prescribedMedication: ['None'],
      currentInvestigations: null,
      chronicPain: null,
    },
    psychologicalHistory: {
      previousTherapy: null,
      previousTherapyDetails:
        'I worked with a therapist through the U.S. Department of Veterans Affairs including ACT, anxiety/stress management, relationship work and attachment exploration.',
      psychiatricMedicationHistory: null,
      familyMentalHealthHistory: null,
      familyMentalHealthDetails: 'Biopolar, severe depression',
    },
    lifestyleAndSymptoms: {
      sleepProblems: null,
      sleepRating: null,
      exerciseFrequency: '2-3',
      exerciseTypes: ['Running', 'Kettlebell', 'Bands', 'Jiu-jitsu', 'Tennis'],
      foodBodyImageIssues: null,
      foodBodyImageDetails: 'So stressed I am skipping meals. Not making my own food.',
      depressionGriefSadness: null,
      depressionGriefDetails:
        'Significant grief/sadness/symptoms of depression related to marriage crisis and possible divorce, with poor sleep, anxiety and periods of hopelessness.',
      anxietyPanicPhobias: null,
      anxietyDetails: null,
      alcoholDrugs: null,
      alcoholDrugDetails: null,
      romanticRelationship: null,
      relationshipLength: '13 married, 18 total years together',
      relationshipRating: null,
    },
    psychosocialFactors: {
      ...base.psychosocialFactors,
      household: 'Me, partner, and 10 year old child',
      occupation: 'Self-employed',
    },
    developmentalHistory: {
      childhoodDescription:
        'Unstable home, emotional neglect, trauma, emotional suppression, independence and prioritising others. Learned to handle problems alone.',
      schoolExperience: null,
    },
    traumaHistory: {
      traumaticEvent: null,
      traumaticEventDetails: 'Parent injury, house fire, parental fighting.',
      childhoodAdolescentAbuse: null,
      abuseDetails: 'Father breaking right leg at the femur.',
    },
    identityAndSelfDescription: {
      fiveWords: ['Loyal', 'Strong', 'Kind', 'Big heart', 'Tenacious', 'Funny'],
      mostImportantThing: 'My family and dogs.',
      significantAchievement: null,
    },
    strengths: {
      strengths:
        'Motivated to change; values family; exercises regularly; reflective; previous therapy engagement; loyal, kind, strong, tenacious.',
    },
    vulnerabilities: {
      weaknesses:
        'I also struggle with anxiety, self-doubt, and overthinking. Defensive when criticised or misunderstood; withdraw emotionally; difficulty asking for help; handle problems alone; move into fixing / solutions.',
    },
    extractionWarnings: [
      {
        code: 'ambiguous_boolean',
        message: 'Yes/No options present without clear selection for sleep problems.',
        fieldPath: 'lifestyleAndSymptoms.sleepProblems',
        sourceExcerpt: 'Sleep problems\nNo\nYes',
      },
      {
        code: 'ambiguous_boolean',
        message: 'Yes/No options present without clear selection for anxiety.',
        fieldPath: 'lifestyleAndSymptoms.anxietyPanicPhobias',
        sourceExcerpt: null,
      },
      {
        code: 'ambiguous_rating',
        message: 'Severity scale listed without identifiable selection.',
        fieldPath: 'presentingProblem.severity',
        sourceExcerpt: null,
      },
      {
        code: 'truncated',
        message: 'Presenting problem response appears truncated in supplied text.',
        fieldPath: 'presentingProblem.summary',
        sourceExcerpt: 'become a healthier, e',
      },
      {
        code: 'truncated',
        message: 'Presenting problem response appears truncated in supplied text.',
        fieldPath: 'presentingProblem.summary',
        sourceExcerpt: 'become a healthier, e',
      },
    ],
    fieldMeta: [
      {
        path: 'personalInformation.fullName',
        confidence: 'high',
        sourceQuestion: 'Full Name',
        sourceExcerpt: 'Full Name*\nAlex Morgan',
      },
    ],
  };
}

/** Broken extraction that would have come from label/positional parsing. */
export const BROKEN_LABEL_EXTRACTION: ExtractedIntake = {
  ...emptyExtractedIntake(),
  personalInformation: {
    ...emptyExtractedIntake().personalInformation,
    fullName: '*',
    preferredName: 'Preferred Name*',
    dateOfBirth: '*',
    email: 'Address',
    telephone: 'Number*',
    homeAddress: 'Address',
    pronouns: '(He/Him, She/Her, They/Them)',
  },
};
