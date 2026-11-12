<?php

use App\Http\Controllers\AiSettingsController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FlashcardController;
use App\Http\Controllers\MaterialController;
use App\Http\Controllers\PerformanceController;
use App\Http\Controllers\QuestionController;
use App\Http\Controllers\ReviewPriorityController;
use App\Http\Controllers\StudySessionController;
use App\Http\Controllers\SubjectController;
use App\Http\Controllers\TopicController;
use App\Http\Controllers\TutorController;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user', [AuthController::class, 'update']);
    Route::post('/logout', [AuthController::class, 'logout']);

    Route::get('/user/ai-settings', [AiSettingsController::class, 'index']);
    Route::put('/user/ai-settings', [AiSettingsController::class, 'update']);
    Route::delete('/user/ai-key', [AiSettingsController::class, 'destroyKey']);

    Route::middleware('throttle:ai-generation')->group(function () {
        Route::post('/subjects/{id}/regenerate-topics', [SubjectController::class, 'regenerateTopics']);
        Route::post('/subjects/{slug}/questions/generate', [QuestionController::class, 'generate']);
        Route::post('/material/{id}/reprocess', [MaterialController::class, 'reprocess']);
        Route::post('/flashcards/generate/{topicId}', [FlashcardController::class, 'generate']);
    });

    Route::get('/subjects', [SubjectController::class, 'index']);
    Route::get('/subjects/questions', [SubjectController::class, 'questions']);
    Route::get('/subject/{slug}', [SubjectController::class, 'show']);
    Route::get('/subject/{slug}/topic/{topicSlug}', [TopicController::class, 'index']);
    Route::post('/subjects', [SubjectController::class, 'add']);
    Route::delete('/subject/{id}', [SubjectController::class, 'destroy']);

    Route::get('/materials', [MaterialController::class, 'index']);
    Route::post('/material', [MaterialController::class, 'upload']);
    Route::delete('/material/{id}', [MaterialController::class, 'destroy']);

    Route::get('/flashcards', [FlashcardController::class, 'index']);
    Route::get('/flashcards/{slug}', [FlashcardController::class, 'show']);
    Route::get('/flashcards/revisar/{slug}', [FlashcardController::class, 'review']);
    Route::post('/flashcards/{flashcardId}/review', [FlashcardController::class, 'submitReview']);
    Route::delete('/flashcard/{id}', [FlashcardController::class, 'destroy']);

    Route::get('/questions/recommended', [QuestionController::class, 'recommended']);
    Route::get('/questions/wrong', [QuestionController::class, 'wrong']);
    Route::get('/questions/subject/{slug}', [QuestionController::class, 'bySubject']);
    Route::post('/questions/{question}/answer', [QuestionController::class, 'answer']);
    Route::delete('/questions/{question}', [QuestionController::class, 'delete']);

    Route::post('/study-sessions', [StudySessionController::class, 'start']);
    Route::post('/study-sessions/{studySession}/questions/{questionId}/answer', [StudySessionController::class, 'answerQuestion']);
    Route::post('/study-sessions/{studySession}/flashcards/{flashcardId}/review', [StudySessionController::class, 'reviewFlashcard']);
    Route::post('/study-sessions/{studySession}/finish', [StudySessionController::class, 'finish']);

    Route::get('/dashboard', [DashboardController::class, 'index']);
    Route::get('/performance', [PerformanceController::class, 'index']);
    Route::get('/review-priority', [ReviewPriorityController::class, 'index']);

    Route::get('/tutor/conversations', [TutorController::class, 'index']);
    Route::get('/tutor/conversations/{id}', [TutorController::class, 'show']);
    Route::post('/tutor/conversations', [TutorController::class, 'start']);
    Route::post('/tutor/conversations/{id}/messages', [TutorController::class, 'sendMessage']);
    Route::delete('/tutor/conversations/{id}', [TutorController::class, 'destroy']);
});
