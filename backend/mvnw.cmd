@REM ----------------------------------------------------------------------------
@REM Licensed to the Apache Software Foundation (ASF) under one
@REM or more contributor license agreements.  See the NOTICE file
@REM distributed with this work for additional information
@REM regarding copyright ownership.  The ASF licenses this file
@REM to you under the Apache License, Version 2.0 (the
@REM "License"); you may not use this file except in compliance
@REM with the License.  You may obtain a copy of the License at
@REM
@REM    https://www.apache.org/licenses/LICENSE-2.0
@REM
@REM Unless required by applicable law or agreed to in writing,
@REM software distributed under the License is distributed on an
@REM "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
@REM KIND, either express or implied.  See the License for the
@REM specific language governing permissions and limitations
@REM under the License.
@REM ----------------------------------------------------------------------------

@REM Apache Maven Wrapper startup batch script, version 3.3.2

@IF "%__MVNW_ARG0_NAME__%"=="" (SET "__MVNW_ARG0_NAME__=%~nx0")
@SET @@MVNW_BAT_FILE=%~f0
@IF NOT "%JAVA_HOME%"=="" (SET "JAVA_EXEC=%JAVA_HOME%\bin\java.exe") ELSE (SET "JAVA_EXEC=java.exe")

@SET "BASEDIR=%~dp0"
@SET "WRAPPER_JAR=%BASEDIR%.mvn\wrapper\maven-wrapper.jar"
@SET "WRAPPER_PROPERTIES=%BASEDIR%.mvn\wrapper\maven-wrapper.properties"

@IF NOT EXIST "%WRAPPER_JAR%" (
    @FOR /F "usebackq delims== tokens=1,2" %%A IN ("%WRAPPER_PROPERTIES%") DO (
        @IF "%%A"=="wrapperUrl" (SET "WRAPPER_URL=%%B")
    )
    @echo Downloading Maven Wrapper from: %WRAPPER_URL%
    @powershell -Command "(New-Object System.Net.WebClient).DownloadFile('%WRAPPER_URL%', '%WRAPPER_JAR%')"
)

@"%JAVA_EXEC%" -classpath "%WRAPPER_JAR%" org.apache.maven.wrapper.MavenWrapperMain %*
