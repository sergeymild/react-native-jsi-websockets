#include <jsi/jsilib.h>
#include <jsi/jsi.h>

#ifndef Macros_h
#define Macros_h

#define JSI_HOST_FUNCTION(NAME, ARGS_COUNT)                                   \
            jsi::Function::createFromHostFunction(              \
                *runtime_,                                      \
                jsi::PropNameID::forUtf8(*runtime_, NAME),      \
                ARGS_COUNT,                                     \
                [=](jsi::Runtime &runtime,                      \
                    const jsi::Value &thisArg,                  \
                    const jsi::Value *args,                     \
                    size_t count) -> jsi::Value
#endif
