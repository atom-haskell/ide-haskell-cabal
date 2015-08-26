{-# OPTIONS_GHC -Wall #-}
{-# LANGUAGE GADTs #-}
{-# LANGUAGE KindSignatures #-}
{-# LANGUAGE NoMonomorphismRestriction #-}
{-# LANGUAGE RankNTypes #-}
module Main (main, parseDotCabal) where

-- base
import Control.Monad

-- ghcjs
import GHCJS.Foreign
import GHCJS.Types
-- import GHCJS.Prim (JSException)

-- Cabal
import Distribution.PackageDescription
import Distribution.PackageDescription.Parse
-- import Distribution.Verbosity
import Distribution.Text
import Distribution.Package

foreign import javascript safe "$1($2);"
  invokeCallback :: JSFun (JSRef a -> IO ()) -> JSRef a -> IO ()

main :: IO ()
main = putStrLn "Dummy main"

parseDotCabal :: JSString -> JSFun (JSRef a -> IO ()) -> IO ()
parseDotCabal input callback = do
    case parsePackageDescription (fromJSString input) of
      ParseFailed _err ->
        invokeCallback callback nullRef
      ParseOk _warnings gpkg -> do
        let pkg     = package (packageDescription gpkg)
            name    = display $ pkgName    pkg
            version = display $ pkgVersion pkg

        let targets :: [PureJSRef (JSRef ())]
            targets = concat [
                case condLibrary gpkg of
                  Nothing -> []
                  Just _  -> [PureObj [
                      PureFld "type"   $ pureJSString "library"
                    , PureFld "name"   $ pureJSString name
                    , PureFld "target" $ pureJSString ("lib:" ++ name)
                    ]]
              , flip map (condExecutables gpkg) $ \(exe, _) -> PureObj [
                      PureFld "type"   $ pureJSString "executable"
                    , PureFld "name"   $ pureJSString exe
                    , PureFld "target" $ pureJSString ("exe:" ++ exe)
                    ]
              , flip map (condTestSuites gpkg) $ \(test, _) -> PureObj [
                      PureFld "type"   $ pureJSString "test-suite"
                    , PureFld "name"   $ pureJSString test
                    , PureFld "target" $ pureJSString ("test:" ++ test)
                    ]
              , flip map (condBenchmarks gpkg) $ \(bench, _) -> PureObj [
                      PureFld "type"   $ pureJSString "benchmark"
                    , PureFld "name"   $ pureJSString bench
                    , PureFld "target" $ pureJSString ("bench:" ++ bench)
                    ]
              ]

            descr = PureObj [
                PureFld "name"    $ pureJSString name
              , PureFld "version" $ pureJSString version
              , PureFld "targets" $ PureArr targets
              ]

        invokeCallback callback =<< fromPureJSRef descr

{-------------------------------------------------------------------------------
  Auxiliary: make it a bit easier to construct JS dictionaries
-------------------------------------------------------------------------------}

data PureJSRef :: * -> * where
    PureEmb :: a -> PureJSRef a
    PureArr :: [PureJSRef (JSRef a)] -> PureJSRef (JSArray a)
    PureObj :: [PureField] -> PureJSRef (JSRef a)

data PureField :: * where
    PureFld :: String -> PureJSRef (JSRef a) -> PureField

pureJSString :: ToJSString a => a -> PureJSRef JSString
pureJSString = PureEmb . toJSString

fromPureJSRef :: PureJSRef a -> IO a
fromPureJSRef (PureEmb emb)   = return emb
fromPureJSRef (PureArr elems) = toArray =<< mapM fromPureJSRef elems
fromPureJSRef (PureObj flds)  = do obj <- newObj
                                   forM_ flds $ \(PureFld nm val) -> do
                                     val' <- fromPureJSRef val
                                     setProp nm val' obj
                                   return obj
