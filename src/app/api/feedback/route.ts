import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Simple in-memory rate limiting (per IP address)
const submissionTimes = new Map<string, number[]>();

function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000); // 1 hour in milliseconds

    const times = submissionTimes.get(ip) || [];
    const recentTimes = times.filter(t => t > oneHourAgo);

    if (recentTimes.length >= 3) {
        return false; // Rate limit exceeded
    }

    recentTimes.push(now);
    submissionTimes.set(ip, recentTimes);

    // Clean up old entries periodically
    if (submissionTimes.size > 1000) {
        for (const [key, value] of submissionTimes.entries()) {
            if (value.every(t => t < oneHourAgo)) {
                submissionTimes.delete(key);
            }
        }
    }

    return true;
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, message, website } = body;

        // Honeypot check - if 'website' field is filled, it's a bot
        if (website) {
            // Return success to fool the bot, but don't actually send the email
            console.log('Bot detected via honeypot');
            return NextResponse.json({ success: true, message: 'Feedback received!' });
        }

        // Validate message
        if (!message || message.trim().length === 0) {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        // Validate email format if provided
        if (email && email.trim().length > 0) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return NextResponse.json(
                    { error: 'Invalid email format' },
                    { status: 400 }
                );
            }
        }

        // Get client IP for rate limiting
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ||
            req.headers.get('x-real-ip') ||
            'unknown';

        // Check rate limit
        if (!checkRateLimit(ip)) {
            return NextResponse.json(
                { error: 'Too many submissions. Please try again later.' },
                { status: 429 }
            );
        }

        // Create email transporter for Hostinger SMTP (SSL on port 465)
        const port = parseInt(process.env.EMAIL_SERVER_PORT || '465');
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_SERVER_HOST || 'smtp.hostinger.com',
            port: port,
            secure: port === 465, // true for port 465 (SSL), false for 587 (STARTTLS)
            auth: {
                user: process.env.EMAIL_SERVER_USER || '',
                pass: process.env.EMAIL_SERVER_PASSWORD || '',
            },
            connectionTimeout: 15000, // 15 seconds
            greetingTimeout: 15000,
            socketTimeout: 15000,
        });

        // Verify SMTP connection before sending
        try {
            await transporter.verify();
            console.log('SMTP connection verified successfully');
        } catch (verifyError) {
            console.error('SMTP verification failed:', verifyError);
            console.error('SMTP Config:', {
                host: process.env.EMAIL_SERVER_HOST,
                port: port,
                user: process.env.EMAIL_SERVER_USER ? '***set***' : '***NOT SET***',
                pass: process.env.EMAIL_SERVER_PASSWORD ? '***set***' : '***NOT SET***',
            });
            return NextResponse.json(
                { error: 'Email server connection failed. Please try again later.' },
                { status: 500 }
            );
        }

        // Send email
        const userEmail = email?.trim() || 'Anonymous';
        await transporter.sendMail({
            from: process.env.EMAIL_FROM || 'feedback@riskrewardcalc.com',
            to: 'feedback@riskrewardcalc.com',
            replyTo: userEmail !== 'Anonymous' ? userEmail : undefined,
            subject: 'New Feedback from RiskRewardCalc',
            text: `From: ${userEmail}\n\nMessage:\n${message}\n\n---\nSent from RiskRewardCalc Feedback Form`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #10B981;">New Feedback</h2>
                    <p><strong>From:</strong> ${userEmail}</p>
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0; white-space: pre-wrap;">${message}</p>
                    </div>
                    <p style="color: #666; font-size: 12px;">Sent from RiskRewardCalc Feedback Form</p>
                </div>
            `,
        });

        console.log('Feedback email sent to feedback@riskrewardcalc.com');

        return NextResponse.json({
            success: true,
            message: 'Feedback received!'
        });
    } catch (error) {
        console.error('Feedback API error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Error details:', errorMessage);
        return NextResponse.json(
            { error: 'Failed to send feedback' },
            { status: 500 }
        );
    }
}
