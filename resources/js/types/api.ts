export type SubjectStatus = "pending" | "processing" | "ready" | "failed";

export type GenerationStatus = "processing" | "ready" | "failed";

export type Topic = {
    id: number;
    subject_id: number;
    parent_id: number | null;
    name: string;
    slug: string;
    order: number;
    depth: number | null;
    description: string | null;
    flashcards_status?: GenerationStatus | null;
    flashcards_error?: string | null;
};

export type TopicWithChildren = Topic & {
    children?: TopicWithChildren[];
};

export type Subject = {
    id: number;
    user_id: number;
    name: string;
    slug: string;
    status: SubjectStatus;
    topics_generated_at: string | null;
    questions_status?: GenerationStatus | null;
    topics_error?: string | null;
    questions_error?: string | null;
    topics?: TopicWithChildren[];
    topics_count?: number;
    flashcards_count?: number;
    questions_count?: number;
    progress?: number;
};

export type Flashcard = {
    id: number;
    subject_id: number;
    topic_id: number;
    front: string;
    back: string;
    created_at?: string;
};

export type QuestionOption = {
    id: number;
    question_id: number;
    text: string;
    is_correct: boolean;
    order: number;
};

export type Question = {
    id: number;
    subject_id: number;
    topic_id: number;
    statement: string;
    explanation: string | null;
    options?: QuestionOption[];
};

export type SubjectWithFlashcards = Subject & {
    flashcards?: Flashcard[];
};

export type QuestionWithTopic = Question & {
    topic?: Topic | null;
};

export type SubjectWithQuestions = Subject & {
    questions?: QuestionWithTopic[];
};

export type FuzzyTerm = {
    name: string;
    points: [number, number, number, number];
};

export type FuzzyVariable = {
    name: string;
    min: number;
    max: number;
    terms: FuzzyTerm[];
};