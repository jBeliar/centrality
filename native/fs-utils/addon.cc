#include <nan.h>
#include <windows.h>
#include <shlobj.h>

using namespace v8;
using namespace std;

wstring stringToWString(const string& s) {
    wstring temp(s.length(),L' ');
    copy(s.begin(), s.end(), temp.begin());
    return temp;
}

string getPath(string _path) {
    IShellLinkA* psl;
    CoInitialize( 0 );
    char* tempStr = new char[MAX_PATH];
    HRESULT hr = CoCreateInstance(CLSID_ShellLink, NULL, CLSCTX_INPROC_SERVER, IID_IShellLink, (LPVOID *) &psl);

    if (SUCCEEDED(hr)) {
        IPersistFile *ppf;
        hr = psl->QueryInterface(IID_IPersistFile, (LPVOID *) &ppf);
        if (SUCCEEDED(hr)) {
            
          wstring path = stringToWString(_path);
          const wchar_t *chars = path.c_str();
          hr = ppf->Load(chars, STGM_READ);
          if (SUCCEEDED(hr)) {
              WIN32_FIND_DATA wfd;
              psl->GetPath(tempStr, MAX_PATH, &wfd, SLGP_UNCPRIORITY | SLGP_RAWPATH);
              return tempStr;
          }
        }
    }
    return _path;
}

string SetGlobalPaths(string &input) {
  return getPath(input);
}

class PathFindWorker : public Nan::AsyncWorker {
 public:
  PathFindWorker(Nan::Callback *callback, string path)
    : AsyncWorker(callback), path(path) {}
  ~PathFindWorker() {}

  void Execute () {
    global_path = SetGlobalPaths(path);
  }

  void HandleOKCallback () {
    Local<String> pp = Nan::New<String>(global_path.c_str()).ToLocalChecked();
    Local<Value> argv[] = { pp };
    callback->Call(1, argv);
  }
 private:
  string path;
  string global_path;
};

void FindPath(const Nan::FunctionCallbackInfo<v8::Value>& info) {
  v8::Local<v8::Function> cb = info[0].As<v8::Function>();
  Local<String> jsString = Local<String>::Cast(info[0]);
  v8::String::Utf8Value param1(jsString->ToString());
  string input = string(*param1);
  Nan::Callback *callback = new Nan::Callback(Nan::To<Function>(info[1]).ToLocalChecked());
  Nan::AsyncQueueWorker(new PathFindWorker(callback, input));
}

void Init(v8::Local<v8::Object> exports) {
  exports->Set(
    Nan::New("findPath").ToLocalChecked(),
    Nan::New<v8::FunctionTemplate>(FindPath)->GetFunction()
  );
}

NODE_MODULE(addon, Init)