// ===================================================================
// Unit 5: "Use Jenkins to check code before pushing."
// Minimal declarative pipeline: install deps, run the automated
// smoke test (server/utils/selftest.js) against a local MongoDB,
// then report pass/fail. Point a Jenkins "Pipeline script from SCM"
// job at this repo and it will pick this file up automatically.
// ===================================================================
pipeline {
    agent any

    environment {
        MONGO_URI    = 'mongodb://127.0.0.1:27017/esports_db_ci'
        JWT_SECRET   = 'jenkins-ci-secret'
        PORT         = '5050'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install dependencies') {
            steps {
                dir('server') {
                    sh 'npm install'
                }
            }
        }

        stage('Seed test database') {
            steps {
                dir('server') {
                    sh 'npm run seed'
                }
            }
        }

        stage('Run automated checks') {
            steps {
                dir('server') {
                    sh 'npm test'
                }
            }
        }
    }

    post {
        success {
            echo 'Build checked out clean - safe to push / deploy.'
        }
        failure {
            echo 'Build failed - do not push this commit.'
        }
    }
}
