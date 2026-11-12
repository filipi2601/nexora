<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request) {}

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (!Auth::attempt([
            'email' => $data['email'],
            'password' => $data['password'],
        ])) {
            throw ValidationException::withMessages([
                'email' => ['As credenciais estão incorretas.'],
            ]);
        }

        $request->session()->regenerate();

        return response()->json([
            'user' => $request->user(),
        ]);
    }

    public function user(Request $request)
    {
        return response()->json($request->user());
    }

    public function update(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:255'],

            'email' => [
                'sometimes',
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],

            'avatar_url' => [
                'nullable',
                'url',
                'max:2048',
            ],

            'study_reminder_enabled' => [
                'sometimes',
                'boolean',
            ],

            'study_reminder_time' => [
                'nullable',
                'date_format:H:i',
            ],

            'current_password' => [
                'nullable',
                'required_with:new_password',
                'current_password:sanctum',
            ],

            'new_password' => [
                'nullable',
                'required_with:current_password',
                'confirmed',
                'min:8',
            ],
        ]);

        if (isset($data['new_password'])) {
            $data['password'] = Hash::make($data['new_password']);
            unset(
                $data['new_password'],
                $data['current_password']
            );
        }

        $user->update($data);

        return response()->json([
            'message' => 'Dados atualizados com sucesso.',
            'user' => $user->fresh(),
        ]);
    }

    public function logout(Request $request)
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logout realizado com sucesso.',
        ]);
    }
}
